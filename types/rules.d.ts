import { RuleSetRule } from 'webpack';
import { Options, Rules } from './types';
export declare const minimumSupportedBrowsers: {
    chrome: string;
    edge: string;
    firefox: string;
    ios: string;
    opera: string;
    safari: string;
    samsung: string;
};
export declare const unneededBabelPlugins: string[];
export declare function checkTypescript(rulesOptions: Rules, srcFolder: string): Promise<boolean>;
export declare function checkReact(rulesOptions: Rules, srcFolder: string): Promise<boolean>;
export declare function normalizeAssetPath({ filename }: {
    filename?: string;
}): string;
export declare function setupRules(options: Options): Promise<Array<RuleSetRule>>;
