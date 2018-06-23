import { Plugin } from 'webpack';
import { Options } from './types';
export declare const serviceWorkerDefaultInclude: RegExp[];
export declare const serviceWorkerDefaultExclude: RegExp[];
export declare function setupPlugins(options: Options): Promise<Array<Plugin>>;
