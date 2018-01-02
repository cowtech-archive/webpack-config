import { Configuration } from './configuration';
export interface PluginOptions {
    concatenate?: boolean;
    minify?: boolean;
    minifyOptions?: any;
    hotModuleReload?: boolean;
    commonChunks?: boolean;
    sizeAnalyzerServer?: boolean;
    afterHook?(plugins: Array<any>): Array<any>;
}
export declare function setupPlugins(configuration: Configuration, environment: any): Array<any>;
