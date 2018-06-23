import { get } from 'lodash'
import { resolve } from 'path'
import { autoDetectEntries } from './modules/entries'
import { setupEnvironment } from './modules/environment'
import { loadIcons } from './modules/icons'
import { setupPlugins } from './modules/plugins'
import { setupRules } from './modules/rules'
import { setupServer } from './modules/server'
import { ExtendedConfiguration, Options } from './modules/types'

export * from './modules/entries'
export * from './modules/environment'
export * from './modules/icons'
export * from './modules/plugins'
export * from './modules/rules'
export * from './modules/server'
export * from './modules/types'

export function generateVersion(): string {
  return new Date()
    .toISOString()
    .replace(/([-:])|(\.\d+Z$)/g, '')
    .replace('T', '.')
}

export async function setup(options: Options = {}): Promise<ExtendedConfiguration> {
  if (!options.environment) options.environment = 'development'
  if (!options.version) options.version = generateVersion()

  options.srcFolder = resolve(process.cwd(), get(options, 'srcFolder', 'src')!)
  options.destFolder = resolve(process.cwd(), get(options, 'destFolder', 'dist')!)
  options.env = setupEnvironment(options)
  options.icons = await loadIcons(options)

  const server = await setupServer(options)

  let config: ExtendedConfiguration = {
    mode: options.environment === 'development' ? 'development' : 'production',
    entry: options.entries || (await autoDetectEntries(options)),
    output: {
      filename: get(options, 'filename', '[name]'),
      path: options.destFolder,
      publicPath: get(options, 'publicPath', '/'),
      libraryTarget: options.libraryTarget
    },
    target: options.target,
    module: {
      rules: await setupRules(options)
    },
    resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
    plugins: await setupPlugins(options),
    externals: options.externals,
    devtool: options.environment === 'development' ? get(options, 'sourceMaps', 'source-map') : false,
    devServer: server,
    serve: server
  }

  if (typeof options.afterHook === 'function') config = await options.afterHook(config)

  return config
}
