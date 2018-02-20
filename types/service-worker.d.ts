/// <reference types="webpack" />
import * as webpack from 'webpack';
import { Configuration } from './configuration';
export interface ServiceWorker {
    source?: string;
    dest?: string;
    include?: Array<string | RegExp>;
    exclude?: Array<string | RegExp>;
    templatedUrls?: {
        [key: string]: string | Array<string>;
    };
    afterHook?(config: any): any;
}
export declare function setupServiceWorker(config: webpack.Configuration, configuration: Configuration): webpack.Configuration;
