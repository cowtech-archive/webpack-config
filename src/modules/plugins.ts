// @ts-ignore
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import globby from 'globby'
// @ts-ignore
import HtmlWebpackPlugin from 'html-webpack-plugin'
import get from 'lodash.get'
import { basename, resolve } from 'path'
// @ts-ignore
import TerserPlugin from 'terser-webpack-plugin'
import { Compiler, DefinePlugin, EnvironmentPlugin, HotModuleReplacementPlugin, Plugin } from 'webpack'
// @ts-ignore
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
// @ts-ignore
import { InjectManifest } from 'workbox-webpack-plugin'
import { runHook } from './environment'
import { checkTypescript } from './rules'
import { Options, Plugins, ServiceWorker } from './types'

export * from './plugins/babel-remove-function'

export const serviceWorkerDefaultInclude = [/\.(html|js|json|css)$/, /\/images.+\.(bmp|jpg|jpeg|png|svg|webp)$/]
export const serviceWorkerDefaultExclude: Array<string | RegExp> = [
  /\.map$/,
  /manifest\.json/,
  /bundle\.js/,
  /404\.html/
]

class ServiceWorkerEnvironment {
  public dest: string
  public version: string
  public debug: boolean

  constructor({ dest, version, debug }: { dest: string; version: string; debug: boolean }) {
    this.dest = dest
    this.version = version
    this.debug = debug
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tap('ServiceWorkerEnvironment', compilation => {
      const content = `self.__version = '${this.version}'; self.__debug = ${this.debug};`

      compilation.assets[this.dest] = {
        source: function() {
          return content
        },
        size: function() {
          return content.length
        }
      }
    })
  }
}

export async function resolveFile(options: Options, key: string, pattern: string): Promise<string | null> {
  let file: boolean | string = get(options, key, true)

  if (file === true) {
    file = (await globby(resolve(options.srcFolder!, pattern)))[0]
  }

  return typeof file === 'string' ? file : null
}

export async function setupPlugins(options: Options): Promise<Array<Plugin>> {
  const pluginsOptions: Plugins = options.plugins || {}
  const swOptions: ServiceWorker = options.serviceWorker || {}
  const useTypescript = await checkTypescript(options.rules || {}, options.srcFolder!)
  const analyze: boolean | string = get(pluginsOptions, 'analyze', true)!
  const hmr = get(options, 'server.hot', true)

  const indexFile = await resolveFile(options, 'index', './index.html.(js|ts|jsx|tsx)')

  let plugins: Array<Plugin> = [
    new EnvironmentPlugin({
      NODE_ENV: options.environment
    }),
    new DefinePlugin({
      ENV: JSON.stringify(options.env),
      VERSION: JSON.stringify(options.version),
      ICONS: JSON.stringify(options.icons)
    })
  ]

  if (indexFile) {
    plugins.push(
      new HtmlWebpackPlugin({
        template: indexFile,
        minify: { collapseWhitespace: true },
        inject: false,
        excludeAssets: [/\.js$/]
      })
    )
  }

  if (useTypescript) {
    plugins.push(
      new ForkTsCheckerWebpackPlugin({
        checkSyntacticErrors: true,
        async: false,
        workers: ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE
      })
    )
  }

  if (options.environment === 'production') {
    if (get(pluginsOptions, 'minify', true)) plugins.push(new TerserPlugin(get(options, 'uglify', {})))
  } else if (hmr) {
    plugins.push(new HotModuleReplacementPlugin())
  }

  if (analyze) {
    if (basename(process.argv[1]) !== 'webpack') {
      plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: typeof analyze === 'string' ? analyze : 'server',
          analyzerHost: get(options, 'server.host', 'home.cowtech.it'),
          analyzerPort: get(options, 'server.port', 4200) + 2,
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

  if (get(swOptions, 'enabled', options.environment === 'production')) {
    let swSrc = await resolveFile(options, 'serviceWorker.src', './(service-worker|sw).(js|ts)')

    if (swSrc) {
      const swDest = get(swOptions, 'dest', 'sw.js')!
      const envFile = swDest.replace(/\.js$/, `-env-${options.version}.js`)

      serviceWorkerDefaultExclude.push(envFile)

      plugins.push(
        new ServiceWorkerEnvironment({
          dest: envFile,
          version: options.version!,
          debug: options.environment !== 'production'
        }),
        new InjectManifest({
          swSrc,
          swDest,
          include: serviceWorkerDefaultInclude,
          exclude: serviceWorkerDefaultExclude,
          importScripts: [`/${envFile}`],
          ...get(swOptions, 'options', {})
        })
      )
    }
  }

  if (pluginsOptions.additional) plugins = plugins.concat(pluginsOptions.additional)

  return runHook(plugins, pluginsOptions.afterHook)
}
