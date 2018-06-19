import { Plugin } from 'webpack';
import { Options } from './types';
export declare function getIndexFile(options: Options): Promise<string | null>;
export declare function getServiceWorkerFile(options: Options): Promise<string>;
export declare function setupPlugins(options: Options): Promise<Array<Plugin>>;
