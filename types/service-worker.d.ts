/// <reference types="webpack" />
import * as webpack from 'webpack';
import { Configuration } from './configuration';
export interface ServiceWorker {
    template?: string;
    source?: string;
    dest?: string;
    patterns?: Array<string | RegExp>;
    ignores?: Array<string | RegExp>;
    templatedUrls?: {
        [key: string]: string | Array<string>;
    };
    afterHook?(plugin: any): any;
}
export declare function setupServiceWorker(config: webpack.Configuration, configuration: Configuration): webpack.Configuration;
