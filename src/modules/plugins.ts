import globby from 'globby'
// @ts-ignore
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { get } from 'lodash'
import { basename, resolve } from 'path'
// @ts-ignore
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import { DefinePlugin, EnvironmentPlugin, HotModuleReplacementPlugin, optimize, Plugin } from 'webpack'
// @ts-ignore
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
// @ts-ignore
import { InjectManifest } from 'workbox-webpack-plugin'
import { Options, Plugins, ServiceWorker } from './types'

export async function getIndexFile(options: Options): Promise<string | null> {
  let index: boolean | string = get(options, 'index', true)!

  if (index === true) {
    index = (await globby(resolve(options.srcFolder!, './index.html.(js|ts|jsx|tsx)')))[0]
  }

  return typeof index === 'string' ? index : null
}

export async function getServiceWorkerFile(options: Options): Promise<string> {
  let file = get(options, 'serviceWorker.src', null)

  if (!file) {
    file = (await globby(resolve(options.srcFolder!, './(service-worker|sw).(js|ts)')))[0]
  }

  return file
}

export async function setupPlugins(options: Options): Promise<Array<Plugin>> {
  const pluginsOptions: Plugins = options.plugins || {}
  const swOptions: ServiceWorker = options.serviceWorker || {}

  const indexFile = await getIndexFile(options)

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

  /*
  const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

  if (transpilers.includes('typescript'))
    plugins.push(
      new ForkTsCheckerWebpackPlugin({
        checkSyntacticErrors: true,
        async: !typescript.strict,
        workers: ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE
      })
    )
  */

  if (get(pluginsOptions, 'concatenate', true)) plugins.push(new optimize.ModuleConcatenationPlugin())

  if (options.environment === 'production') {
    if (get(pluginsOptions, 'minify', true)) {
      plugins.push(new UglifyJsPlugin({ uglifyOptions: get(options, 'uglify', {}) }))
    }
  } else {
    if (get(pluginsOptions, 'hotModuleReload', true)) {
      plugins.push(new HotModuleReplacementPlugin())
    }

    const analyze: boolean | string = get(pluginsOptions, 'analyze', true)!

    if (analyze) {
      if (basename(process.argv[1]) === 'webpack-dev-server') {
        plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: typeof analyze === 'string' ? analyze : 'server',
            analyzerHost: get(options, 'server.host', 'home.cowtech.it'),
            analyzerPort: get(options, 'server.port', 4200) + 1,
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
  }

  if (get(swOptions, 'enabled', null) === true || options.environment === 'production') {
    let swSrc = await getServiceWorkerFile(options)

    if (swSrc) {
      plugins.push(
        new InjectManifest({
          swSrc,
          swDest: get(swOptions, 'dest', 'sw.js')!,
          include: [/\.(html|js|json|css)$/, /\/images.+\.(bmp|jpg|jpeg|png|svg|webp)$/],
          exclude: [/\.map$/, /404\.html/],
          ...get(swOptions, 'options', {})
        })
      )
    }
  }

  if (pluginsOptions.additional) plugins = plugins.concat(pluginsOptions.additional)
  if (pluginsOptions && typeof pluginsOptions.afterHook === 'function') {
    plugins = await pluginsOptions.afterHook(plugins)
  }

  return plugins
}
