import { Plugin } from 'webpack';
import { Options } from './types';
export declare const serviceWorkerDefaultInclude: RegExp[];
export declare const serviceWorkerDefaultExclude: Array<string | RegExp>;
export declare function resolveFile(options: Options, key: string, pattern: string): Promise<string | null>;
export declare function setupPlugins(options: Options): Promise<Array<Plugin>>;
