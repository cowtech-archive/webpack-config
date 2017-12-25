/// <reference types="webpack" />
/// <reference types="node" />
import * as webpack from 'webpack';
import { Configuration } from './configuration';
export declare type Hook = (configuration: webpack.Configuration) => webpack.Configuration;
export interface Https {
    key: Buffer | string;
    cert: Buffer | string;
}
export interface Server {
    host?: string;
    port?: number;
    https?: Https | boolean;
    historyApiFallback?: boolean;
    compress?: boolean;
    hot?: boolean;
    afterHook?(config: any): any;
}
export * from './configuration';
export * from './environment';
export * from './icons';
export * from './plugins';
export * from './rules';
export declare function setupServer(configuration: Configuration): any;
export declare function setup(env: string, configuration: Configuration, afterHook?: Hook): webpack.Configuration;
