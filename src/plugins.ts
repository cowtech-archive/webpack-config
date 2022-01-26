import { cacheName } from '@cowtech/webpack-utils'
import { createHash } from 'crypto'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { readFileSync } from 'fs'
import { globby } from 'globby'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { resolve } from 'path'
import webpack from 'webpack'
// @ts-expect-error - Even if @types/webpack-bundle-analyzer, it generates a conflict with Webpack 5. Revisit in the future.
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { InjectManifest } from 'workbox-webpack-plugin'
import { runHook } from './environment'
import { checkTypescript } from './rules'
import { HtmlWebpackTrackerPluginParameters, Options, Plugins, Rules, ServiceWorker } from './types'

export const serviceWorkerDefaultInclude: Array<string | RegExp> = [
  /\.(?:html|js|json|mjs|css)$/,
  /images.+\.(?:bmp|jpg|jpeg|png|svg|webp)$/
]
export const serviceWorkerDefaultExclude: Array<string | RegExp> = [
  /\.map$/,
  /bundle(?:-.+)?\.(?:mjs|js)$/,
  /404\.html/
]

class ServiceWorkerEnvironment {
  public dest: string
  public content: string
  public workboxUrl: string

  constructor(dest: string, version: string, workboxVersion: string, debug: boolean) {
    this.dest = dest
    this.content = `self.__version = '${version}'\nself.__debug = ${debug};`
    this.workboxUrl = `https://storage.googleapis.com/workbox-cdn/releases/${workboxVersion}/workbox-sw.js`
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap('ServiceWorkerEnvironment', current => {
      current.hooks.processAssets.tap(
        {
          name: 'ServiceWorkerEnvironment',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS
        },
        () => {
          current.emitAsset(this.dest, new webpack.sources.RawSource(this.content))
        }
      )

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      current.getCache(cacheName).storePromise('service-worker-environment', null, this.dest)
    })

    compiler.hooks.compilation.tap('ServiceWorkerEnvironment', current => {
      current.hooks.processAssets.tap(
        {
          name: 'ServiceWorkerEnvironment',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE
        },
        () => {
          const serviceWorkerAsset = current.getAsset('sw.js')

          if (!serviceWorkerAsset) {
            return
          }

          const source = serviceWorkerAsset.source.source() as string

          current.updateAsset(
            'sw.js',
            new webpack.sources.RawSource(
              source.replace('importScripts([])', `importScripts('/${this.dest}', '${this.workboxUrl}')`)
            )
          )
        }
      )
    })
  }
}

class HtmlWebpackTrackerPlugin {
  public files: Map<string, string>

  constructor() {
    this.files = new Map<string, string>()
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap('HtmlWebpackTrackerPlugin', current => {
      const plugin = HtmlWebpackPlugin as any

      plugin
        .getHooks(current)
        .afterEmit.tapPromise(
          'HtmlWebpackTrackerPlugin',
          ({ outputName, plugin }: HtmlWebpackTrackerPluginParameters) => {
            return current
              .getCache(cacheName)
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

export async function setupPlugins(options: Options): Promise<Array<webpack.WebpackPluginInstance>> {
  const pluginsOptions: Plugins = options.plugins ?? {}
  const swOptions: ServiceWorker = options.serviceWorker ?? {}
  const rules: Rules = options.rules ?? {}
  const analyze = pluginsOptions.analyze ?? true
  const useTypescript = await checkTypescript(rules, options.srcFolder!)

  const indexFile = await resolveFile(options, 'index', './index.html.(js|ts|jsx|tsx)')
  const error404 = await resolveFile(options, 'error404', './404.html.(js|ts|jsx|tsx)')
  const manifest = (await globby(resolve(options.srcFolder!, './manifest.json.(js|ts)')))[0]
  const robots = (await globby(resolve(options.srcFolder!, './robots.txt.(js|ts)')))[0]

  let plugins: Array<webpack.WebpackPluginInstance> = [
    new webpack.EnvironmentPlugin({
      NODE_ENV: options.environment
    }),
    new webpack.DefinePlugin({
      ENV: JSON.stringify(options.env),
      VERSION: JSON.stringify(options.version),
      ICONS: JSON.stringify(options.icons)
    }),
    new HtmlWebpackTrackerPlugin()
  ]

  if (useTypescript) {
    plugins.push(new ForkTsCheckerWebpackPlugin({ async: true }))
  }

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

  if (analyze) {
    if (options.environment !== 'production') {
      const analyzerMode = typeof analyze === 'string' ? analyze : 'server'

      plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: analyzerMode as BundleAnalyzerPlugin.Options['analyzerMode'],
          analyzerHost: options.server?.host ?? 'home.cowtech.it',
          analyzerPort: (options.server?.port ?? 4200) + 2,
          generateStatsFile: analyze === 'static',
          openAnalyzer: false,
          logLevel: 'error'
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
      const hash = createHash('sha1')
        .update(JSON.stringify({ version: options.version }))
        .digest('hex')
        .slice(0, 8)

      const swDest = swOptions.dest ?? 'sw.js'
      const envFile = swDest.replace(/\.js$/, `-env-${hash}.js`)
      const wbInfo = JSON.parse(readFileSync(resolve(process.cwd(), './node_modules/workbox-sw/package.json'), 'utf-8'))

      serviceWorkerDefaultExclude.push(envFile)

      plugins.push(
        new InjectManifest({
          swSrc,
          swDest,
          include: serviceWorkerDefaultInclude,
          exclude: serviceWorkerDefaultExclude,
          webpackCompilationPlugins: [
            new ServiceWorkerEnvironment(
              envFile,
              options.version!,
              wbInfo.version,
              swOptions.debug ?? options.environment !== 'production'
            )
          ],
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
