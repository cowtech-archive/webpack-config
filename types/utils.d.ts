import { Compilation } from 'webpack';
import { WebpackCliEnvironment } from './types';
export declare const scriptUrlSuffix: RegExp;
export declare function generateVersion(): string;
export declare function normalizeWebpackEnvironment(env: WebpackCliEnvironment): 'production' | 'development';
export declare function findScriptUrl(compilation: Compilation, path: string, suffixPattern?: RegExp): string | undefined;
