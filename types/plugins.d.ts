import { Compilation, WebpackPluginInstance } from 'webpack';
import { Options } from './types';
export * from './babel-remove-function';
export declare const cacheName = "@cowtech/webpack-config";
export declare const serviceWorkerDefaultInclude: Array<string | RegExp>;
export declare const serviceWorkerDefaultExclude: Array<string | RegExp>;
export declare function resolveFile(options: Options, key: string, pattern: string): Promise<string | null>;
export declare function getManifestUrl(compilation: Compilation): Promise<string | undefined>;
export declare function setupPlugins(options: Options): Promise<Array<WebpackPluginInstance>>;
