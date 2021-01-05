import { createHash } from 'crypto'
import globby from 'globby'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { basename, resolve } from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import {
  Compilation,
  Compiler,
  DefinePlugin,
  EnvironmentPlugin,
  HotModuleReplacementPlugin,
  sources,
  WebpackPluginInstance
} from 'webpack'
// @ts-expect-error - Even if @types/webpack-bundle-analyzer, it generates a conflict with Webpack 5. Revisit in the future.
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { InjectManifest } from 'workbox-webpack-plugin'
import { runHook } from './environment'
import { HtmlWebpackTrackerPluginParameters, Options, Plugins, Rules, ServiceWorker } from './types'

export * from './babel-remove-function'

export const serviceWorkerDefaultInclude: Array<string | RegExp> = [
  /\.(?:html|js|json|mjs|css)$/,
  /images.+\.(?:bmp|jpg|jpeg|png|svg|webp)$/
]
export const serviceWorkerDefaultExclude: Array<string | RegExp> = [
  /\.map$/,
  /bundle(?:-.+)?\.(?:mjs|js)$/,
  /404\.html/
]

interface ServiceWorkConstructorArguments {
  dest: string
  version: string
  debug: boolean
}

class ServiceWorkerEnvironment {
  public dest: string
  public version: string
  public debug: boolean

  constructor({ dest, version, debug }: ServiceWorkConstructorArguments) {
    this.dest = dest
    this.version = version
    this.debug = debug
  }

  apply(compiler: Compiler): void {
    const dest = this.dest

    compiler.hooks.compilation.tap('ServiceWorkerEnvironment', (current: Compilation) => {
      const content = `self.__version = '${this.version}'; self.__debug = ${this.debug};`

      current.hooks.processAssets.tap(
        {
          name: 'ServiceWorkerEnvironment',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
        },
        () => {
          current.emitAsset(dest, new sources.RawSource(content))
        }
      )

      compiler.hooks.emit.tapPromise('ServiceWorkerEnvironment', (current: Compilation) => {
        return current.getCache('cowtech').storePromise('service-worker-environment', null, dest)
      })
    })
  }
}

class HtmlWebpackTrackerPlugin {
  public files: Map<string, string>

  constructor() {
    this.files = new Map<string, string>()
  }

  apply(compiler: Compiler): void {
    compiler.hooks.emit.tap('HtmlWebpackTrackerPlugin', (current: Compilation) => {
      const plugin = HtmlWebpackPlugin as any
      plugin
        .getHooks(current)
        .afterEmit.tapPromise(
          'HtmlWebpackTrackerPlugin',
          ({ outputName, plugin }: HtmlWebpackTrackerPluginParameters) => {
            return current
              .getCache('cowtech')
              .storePromise(`html-webpack-tracker-plugin:${plugin.options.id}`, null, outputName)
          }
        )
    })
  }
}

export async function resolveFile(options: Options, key: string, pattern: string): Promise<string | null> {
  let file = options[key as keyof Options] ?? true

  if (file === true) {
    file = (await globby(resolve(options.srcFolder!, pattern)))[0]
  }

  return typeof file === 'string' ? file : null
}

export async function setupPlugins(options: Options): Promise<Array<WebpackPluginInstance>> {
  const pluginsOptions: Plugins = options.plugins ?? {}
  const swOptions: ServiceWorker = options.serviceWorker ?? {}
  const rules: Rules = options.rules ?? {}
  const analyze = pluginsOptions.analyze ?? true
  const hmr = options.server?.hot ?? true

  const indexFile = await resolveFile(options, 'index', './index.html.(js|ts|jsx|tsx)')
  const error404 = await resolveFile(options, 'error404', './404.html.(js|ts|jsx|tsx)')
  const manifest = (await globby(resolve(options.srcFolder!, './manifest.json.(js|ts)')))[0]
  const robots = (await globby(resolve(options.srcFolder!, './robots.txt.(js|ts)')))[0]

  let plugins: Array<WebpackPluginInstance> = [
    new EnvironmentPlugin({
      NODE_ENV: options.environment
    }),
    new DefinePlugin({
      ENV: JSON.stringify(options.env),
      VERSION: JSON.stringify(options.version),
      ICONS: JSON.stringify(options.icons)
    }),
    new HtmlWebpackTrackerPlugin()
  ]

  if (manifest && (rules.manifest ?? true)) {
    plugins.push(
      new HtmlWebpackPlugin({
        id: 'manifest',
        filename: 'manifest-[contenthash].json',
        template: manifest,
        minify: true,
        inject: false
      })
    )
  }

  if (robots && (rules.robots ?? true)) {
    plugins.push(
      new HtmlWebpackPlugin({
        id: 'robots',
        filename: 'robots.txt',
        template: robots,
        minify: false,
        inject: false
      })
    )
  }

  // if (useTypescript) {
  //   plugins.push(
  //     new ForkTsCheckerWebpackPlugin({
  //       async: false,
  //       typescript: {
  //         enabled: true
  //       }
  //     })
  //   )
  // }

  if (indexFile) {
    plugins.push(
      new HtmlWebpackPlugin({
        template: indexFile,
        minify: { collapseWhitespace: true },
        inject: false
      })
    )
  }

  if (error404) {
    plugins.push(
      new HtmlWebpackPlugin({
        template: error404,
        filename: '404.html',
        minify: { collapseWhitespace: true },
        inject: false
      })
    )
  }

  if (options.environment === 'production') {
    if (pluginsOptions.minify ?? true) {
      plugins.push(new TerserPlugin(options.uglify ?? {}))
    }
  } else if (hmr) {
    plugins.push(new HotModuleReplacementPlugin())
  }

  if (analyze) {
    if (basename(process.argv[1]) !== 'webpack') {
      const analyzerMode = typeof analyze === 'string' ? analyze : 'server'

      plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: analyzerMode as BundleAnalyzerPlugin.Options['analyzerMode'],
          analyzerHost: options.server?.host ?? 'home.cowtech.it',
          analyzerPort: (options.server?.port ?? 4200) + 2,
          generateStatsFile: analyze === 'static',
          openAnalyzer: false
        })
      )
    } else {
      plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          generateStatsFile: true,
          openAnalyzer: false
        })
      )
    }
  }

  if (swOptions.enabled === true || options.environment === 'production') {
    const swSrc = await resolveFile(options, 'serviceWorker.src', './(service-worker|sw).(js|ts)')

    if (swSrc) {
      // Create the hash for the filename
      const hashFactory = createHash('md4')
      hashFactory.update(JSON.stringify({ version: options.version }))
      const hash = hashFactory.digest('hex')

      const swDest = swOptions.dest ?? 'sw.js'
      const envFile = swDest.replace(/\.js$/, `-env-${hash}.js`)

      serviceWorkerDefaultExclude.push(envFile)

      plugins.push(
        new ServiceWorkerEnvironment({
          dest: envFile,
          version: options.version!,
          debug: swOptions.debug ?? options.environment !== 'production'
        }),
        new InjectManifest({
          swSrc,
          swDest,
          include: serviceWorkerDefaultInclude,
          exclude: serviceWorkerDefaultExclude,
          chunks: [`/${envFile}`],
          ...(swOptions.options ?? {})
        })
      )
    }
  }

  if (pluginsOptions.additional) {
    plugins = plugins.concat(pluginsOptions.additional)
  }

  return runHook(plugins, pluginsOptions.afterHook)
}
