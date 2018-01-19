import { Configuration } from './configuration';
export interface Babel {
    browsersWhiteList?: Array<string>;
    exclude?: Array<string>;
    modules?: boolean;
}
export interface TypescriptOptions {
    strict?: boolean;
}
export declare function normalizeIncludePath(path: string): string;
export declare function setupRules(configuration: Configuration, version: string): any[];
export declare function setupResolvers(configuration: Configuration): Array<string>;
