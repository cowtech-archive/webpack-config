/// <reference types="node" />
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { compilation, Configuration, Entry, EntryFunc, ExternalsElement, Options as WebpackOptions, Plugin, RuleSetRule } from 'webpack';
export declare type HookReturn<T> = void | null | T | Promise<void | null | T>;
export declare type Hook<T> = (input: T) => HookReturn<T>;
export declare type Entries = string | Array<string> | Entry | EntryFunc;
export declare type Externals = ExternalsElement | Array<ExternalsElement>;
export declare type Target = 'web' | 'webworker' | 'node' | 'async-node' | 'node-webkit' | 'atom' | 'electron' | 'electron-renderer' | 'electron-main' | ((compiler?: any) => void);
export declare type LibraryTarget = 'var' | 'this' | 'commonjs' | 'commonjs2' | 'amd' | 'umd' | 'window' | 'assign' | 'jsonp';
export declare type FilenameGenerator = (data: OutputData) => string;
export interface HtmlWebpackTrackerPluginParameters {
    outputName: string;
    plugin: HtmlWebpackPlugin.Options;
}
export interface OutputData {
    chunk: compilation.Chunk;
    hash: string;
}
export interface Output {
    filename?: string | FilenameGenerator;
    publicPath?: string;
    target?: Target;
    libraryTarget?: LibraryTarget;
}
export interface Environment {
    environment: string;
    version: string;
    serviceWorkerEnabled: boolean;
    [key: string]: any;
}
export interface Rules {
    additional?: Array<RuleSetRule>;
    babel?: boolean;
    typescript?: boolean;
    react?: boolean;
    images?: boolean;
    manifest?: boolean;
    robots?: boolean;
    afterHook?: Hook<Array<RuleSetRule>>;
}
export interface Plugins {
    additional?: Array<Plugin>;
    concatenate?: boolean;
    minify?: boolean;
    hotModuleReload?: boolean;
    commonChunks?: boolean;
    analyze?: boolean | string;
    afterHook?: Hook<Array<Plugin>>;
}
export interface IconsToLoad {
    [key: string]: Array<string>;
}
export interface Icons {
    tags: {
        [key: string]: string;
    };
    definitions: string;
}
export interface ServiceWorker {
    enabled?: boolean;
    src?: string;
    dest?: string;
    options?: object;
}
export interface Server {
    host?: string;
    port?: number;
    https?: boolean | {
        [key: string]: string | Buffer;
    };
    compress?: boolean;
    hot?: boolean | object;
    history?: boolean | object;
    disableHostCheck?: boolean;
    inline?: boolean;
    afterHook?: Hook<Server>;
}
export interface Babel {
    browsersWhiteList?: Array<string>;
    removeFunctions?: Array<string>;
    exclude?: Array<string>;
    modules?: boolean;
    configuration?: any;
    envDebug?: boolean;
}
export declare type ExtendedConfiguration = Configuration & {
    output: any;
    devServer: any;
};
export interface Options extends Output {
    environment?: string | object;
    additionalEnvironment?: object;
    version?: string;
    env?: Environment;
    entries?: Entries;
    index?: boolean | string;
    rules?: Rules;
    plugins?: Plugins;
    stats?: WebpackOptions.Stats;
    icons?: IconsToLoad | Icons;
    serviceWorker?: ServiceWorker;
    srcFolder?: string;
    destFolder?: string;
    sourceMaps?: WebpackOptions.Devtool;
    externals?: Externals;
    server?: Server;
    babel?: Babel;
    useESModules?: boolean;
    uglify?: object;
    afterHook?: Hook<ExtendedConfiguration>;
}
