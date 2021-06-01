import { generateVersion, normalizeAssetPath } from '@cowtech/webpack-utils'
import { resolve } from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import { WebpackOptionsNormalized, WebpackPluginInstance } from 'webpack'
import { autoDetectEntries } from './entries'
import { runHook, setupEnvironment } from './environment'
import { loadIcons } from './icons'
import { setupPlugins } from './plugins'
import { checkReact, setupRules } from './rules'
import { setupServer } from './server'
import { ExtendedConfiguration, Options } from './types'

export * from './entries'
export * from './environment'
export * from './icons'
export * from './plugins'
export * from './rules'
export * from './server'
export * from './types'

export async function setup(options: Options = {}): Promise<ExtendedConfiguration> {
  if (!options.environment || typeof options.environment !== 'string') {
    options.environment = 'development'
  }

  if (!options.version) {
    options.version = generateVersion()
  }

  options.srcFolder = resolve(process.cwd(), options.srcFolder ?? 'src')
  options.destFolder = resolve(process.cwd(), options.destFolder ?? 'dist')
  options.env = setupEnvironment(options)
  options.icons = await loadIcons(options)

  const server = await setupServer(options)

  const mainExtension = options.useESModules ?? true ? 'mjs' : 'js'

  const minimizer: Array<WebpackPluginInstance> = []

  if (options.environment === 'production' && (options.plugins?.minify ?? true)) {
    minimizer.push(new TerserPlugin(options.uglify ?? {}))
  }

  const resolveOptions: ExtendedConfiguration['resolve'] = { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] }

  if (await checkReact(options.rules ?? {}, options.srcFolder)) {
    resolveOptions.alias = {
      'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
      'react/jsx-runtime': 'react/jsx-runtime.js'
    }
  }

  const config: ExtendedConfiguration = {
    mode: options.environment === 'production' ? 'production' : 'development',
    entry: options.entries ?? (await autoDetectEntries(options)),
    output: {
      filename: `[name]-[contenthash].${mainExtension}`,
      chunkFilename: `[name]-[contenthash].${mainExtension}`,
      path: options.destFolder,
      publicPath: options.publicPath ?? '/',
      libraryTarget: options.libraryTarget,
      assetModuleFilename: normalizeAssetPath
    },
    target: options.target as string,
    module: {
      rules: await setupRules(options)
    },
    resolve: resolveOptions,
    plugins: await setupPlugins(options),
    externals: options.externals,
    devtool: options.environment === 'development' ? options.sourceMaps ?? 'source-map' : false,
    cache: true,
    devServer: server,
    performance: options.performance ?? { hints: false },
    stats: (options.stats ?? 'normal') as WebpackOptionsNormalized['stats'],
    optimization: {
      splitChunks: options.plugins?.splitChunks ?? false,
      concatenateModules: options.plugins?.concatenate ?? true,
      minimize: true,
      minimizer
    }
  }

  return runHook(config, options.afterHook)
}
