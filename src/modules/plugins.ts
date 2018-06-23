// @ts-ignore
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import * as globby from 'globby'
// @ts-ignore
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { get } from 'lodash'
import { basename, resolve } from 'path'
// @ts-ignore
import * as ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin'
// @ts-ignore
import * as UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import { DefinePlugin, EnvironmentPlugin, HotModuleReplacementPlugin, optimize, Plugin } from 'webpack'
// @ts-ignore
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
// @ts-ignore
import { InjectManifest } from 'workbox-webpack-plugin'
import { checkTypescript } from './rules'
import { Options, Plugins, ServiceWorker } from './types'

async function resolveFile(options: Options, key: string, pattern: string): Promise<string | null> {
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
  const hasManifest = await resolveFile(options, 'rules.manifest', 'manifest.json')

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

  if (hasManifest) {
    plugins.push(
      new ReplaceInFileWebpackPlugin([
        {
          dir: options.destFolder,
          files: ['manifest.json'],
          rules: [
            {
              search: '$version',
              replace: options.version
            }
          ]
        }
      ])
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

  if (get(pluginsOptions, 'concatenate', true)) plugins.push(new optimize.ModuleConcatenationPlugin())

  if (options.environment === 'production') {
    if (get(pluginsOptions, 'minify', true)) {
      plugins.push(new UglifyJsPlugin({ uglifyOptions: get(options, 'uglify', {}) }))
    }
  } else {
    if (get(pluginsOptions, 'hotModuleReload', true)) {
      plugins.push(new HotModuleReplacementPlugin())
    }
  }

  const analyze: boolean | string = get(pluginsOptions, 'analyze', true)!

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

  if (get(swOptions, 'enabled', null) === true || options.environment === 'production') {
    let swSrc = await resolveFile(options, 'serviceWorker.src', './(service-worker|sw).(js|ts)')

    if (swSrc) {
      const swDest = get(swOptions, 'dest', 'sw.js')!

      plugins.push(
        new InjectManifest({
          swSrc,
          swDest,
          include: [/\.(html|js|json|css)$/, /\/images.+\.(bmp|jpg|jpeg|png|svg|webp)$/],
          exclude: [/\.map$/, /manifest\.json/, /bundle\.js/, /404\.html/],
          ...get(swOptions, 'options', {})
        }),
        new ReplaceInFileWebpackPlugin([
          {
            dir: options.destFolder,
            files: [swDest],
            rules: [
              {
                search: '$version',
                replace: options.version
              },
              {
                search: '$debug',
                replace: options.environment === 'production' ? 'false' : 'true'
              }
            ]
          }
        ])
      )
    }
  }

  if (pluginsOptions.additional) plugins = plugins.concat(pluginsOptions.additional)
  if (pluginsOptions && typeof pluginsOptions.afterHook === 'function') {
    plugins = await pluginsOptions.afterHook(plugins)
  }

  return plugins
}
