import { RuleSetRule } from 'webpack';
import { Options, Rules } from './types';
export declare function checkTypescript(rulesOptions: Rules, srcFolder: string): Promise<boolean>;
export declare function checkReact(rulesOptions: Rules, srcFolder: string): Promise<boolean>;
export declare function normalizeIncludePath(path: string): string;
export declare function setupRules(options: Options): Promise<Array<RuleSetRule>>;
