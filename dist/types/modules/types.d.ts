/// <reference types="node" />
import { default as Application, Middleware } from 'koa';
import { Configuration, Entry, EntryFunc, ExternalsElement, Options as WebpackOptions, Plugin, RuleSetRule } from 'webpack';
export declare type ExtendedConfiguration = Configuration & {
    serve: any;
};
export declare type Entries = string | Array<string> | Entry | EntryFunc;
export declare type Externals = ExternalsElement | Array<ExternalsElement>;
export declare type ServerAdd = (app: Application, middleware: Middleware, options: object) => void;
export declare type Target = 'web' | 'webworker' | 'node' | 'async-node' | 'node-webkit' | 'atom' | 'electron' | 'electron-renderer' | 'electron-main' | ((compiler?: any) => void);
export declare type LibraryTarget = 'var' | 'this' | 'commonjs' | 'commonjs2' | 'amd' | 'umd' | 'window' | 'assign' | 'jsonp';
export interface Output {
    filename?: string;
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
    afterHook?(configuration: Array<RuleSetRule>): Promise<Array<RuleSetRule>>;
}
export interface Plugins {
    additional?: Array<Plugin>;
    concatenate?: boolean;
    minify?: boolean;
    hotModuleReload?: boolean;
    commonChunks?: boolean;
    analyze?: boolean | string;
    afterHook?(plugins: Array<Plugin>): Promise<Array<Plugin>>;
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
    add?: ServerAdd;
    afterHook?(configuration: Server): Promise<Server>;
}
export interface Babel {
    browsersWhiteList?: Array<string>;
    exclude?: Array<string>;
    modules?: boolean;
    configuration?: any;
}
export interface Options extends Output {
    environment?: string | object;
    additionalEnvironment?: object;
    version?: string;
    env?: Environment;
    entries?: Entries;
    index?: boolean | string;
    rules?: Rules;
    plugins?: Plugins;
    icons?: IconsToLoad | Icons;
    serviceWorker?: ServiceWorker;
    srcFolder?: string;
    destFolder?: string;
    sourceMaps?: WebpackOptions.Devtool;
    externals?: Externals;
    server?: Server;
    babel?: Babel;
    uglify?: object;
    afterHook?(configuration: ExtendedConfiguration): Promise<ExtendedConfiguration>;
}
