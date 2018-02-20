/// <reference types="webpack" />
import * as webpack from 'webpack';
import { IconsLoader } from './icons';
import { Server } from './index';
import { PluginOptions } from './plugins';
import { Babel, TypescriptOptions } from './rules';
import { ServiceWorker } from './service-worker';
export interface Configuration {
    environment?: string;
    version?: string;
    entries: string | Array<string> | {
        [key: string]: string;
    };
    srcFolder: string;
    destFolder: string;
    transpilers?: Array<string>;
    indexFile?: string | boolean;
    icons?: Array<string>;
    iconsLoader?: IconsLoader;
    plugins?: Array<any>;
    pluginsOptions?: PluginOptions;
    babel?: Babel;
    typescript: TypescriptOptions;
    externals?: Array<string>;
    sourceMapsType?: webpack.Options.Devtool;
    server?: Server;
    serviceWorker?: ServiceWorker | boolean;
    afterRulesHook?(rules: Array<any>): Array<any>;
}
export declare const defaultConfiguration: Configuration;
export declare function loadConfigurationEntry<T = string>(key: string, configuration: {
    [key: string]: any;
}, defaults?: {
    [key: string]: any;
}): T;
