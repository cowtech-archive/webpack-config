import HtmlWebpackPlugin from 'html-webpack-plugin'
import {
  compilation,
  Configuration,
  Entry,
  EntryFunc,
  ExternalsElement,
  Options as WebpackOptions,
  Plugin,
  RuleSetRule
} from 'webpack'

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type HookReturn<T> = void | null | T | Promise<void | null | T>
export type Hook<T> = (input: T) => HookReturn<T>

export type Entries = string | Array<string> | Entry | EntryFunc

export type Externals = ExternalsElement | Array<ExternalsElement>

export type Target =
  | 'web'
  | 'webworker'
  | 'node'
  | 'async-node'
  | 'node-webkit'
  | 'atom'
  | 'electron'
  | 'electron-renderer'
  | 'electron-main'
  | ((compiler?: any) => void)

export type LibraryTarget = 'var' | 'this' | 'commonjs' | 'commonjs2' | 'amd' | 'umd' | 'window' | 'assign' | 'jsonp'

export type FilenameGenerator = (data: OutputData) => string

export interface HtmlWebpackTrackerPluginParameters {
  outputName: string
  plugin: HtmlWebpackPlugin.Options
}

export interface OutputData {
  chunk: compilation.Chunk
  hash: string
}

export interface Output {
  filename?: string | FilenameGenerator
  publicPath?: string
  target?: Target
  libraryTarget?: LibraryTarget
}

export interface Environment {
  environment: string
  version: string
  serviceWorkerEnabled: boolean
  [key: string]: any
}

export interface Rules {
  additional?: Array<RuleSetRule>
  babel?: boolean
  typescript?: boolean
  react?: boolean
  images?: boolean
  manifest?: boolean
  robots?: boolean
  afterHook?: Hook<Array<RuleSetRule>>
}

export interface Plugins {
  additional?: Array<Plugin>
  concatenate?: boolean
  minify?: boolean
  hotModuleReload?: boolean
  splitChunks?: boolean | WebpackOptions.SplitChunksOptions
  analyze?: boolean | string
  afterHook?: Hook<Array<Plugin>>
}

export interface IconsToLoad {
  [key: string]: Array<string>
}

export interface Icons {
  tags: { [key: string]: string }
  definitions: string
}

export interface ServiceWorker {
  enabled?: boolean
  src?: string
  dest?: string
  options?: object
  debug?: boolean
}

export interface Server {
  host?: string
  port?: number
  https?: boolean | { [key: string]: string | Buffer }
  compress?: boolean
  hot?: boolean | object
  history?: boolean | object
  disableHostCheck?: boolean
  inline?: boolean
  options?: object
  afterHook?: Hook<Server>
}

export interface Babel {
  browsersWhiteList?: string | Array<string> | { [key: string]: string }
  removeFunctions?: Array<string>
  exclude?: Array<string>
  modules?: boolean
  configuration?: any
  envDebug?: boolean
}

export type ExtendedConfiguration = Configuration & {
  output: any
  devServer: any
}

export interface Options extends Output {
  environment?: string | object
  additionalEnvironment?: object
  version?: string
  env?: Environment
  entries?: Entries
  index?: boolean | string
  rules?: Rules
  plugins?: Plugins
  stats?: WebpackOptions.Stats
  performance?: WebpackOptions.Performance
  icons?: IconsToLoad | Icons
  serviceWorker?: ServiceWorker
  srcFolder?: string
  destFolder?: string
  sourceMaps?: WebpackOptions.Devtool
  externals?: Externals
  server?: Server
  babel?: Babel
  useESModules?: boolean
  uglify?: object
  afterHook?: Hook<ExtendedConfiguration>
}
