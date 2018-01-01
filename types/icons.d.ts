/// <reference types="cheerio" />
import { Configuration } from './configuration';
export interface Icons {
    tags: {
        [key: string]: string;
    };
    definitions: string;
}
export interface IconsLoader {
    loader?(toLoad: Array<string>, loaderConfiguration?: IconsLoader): Icons;
    afterHook?(icons: Icons): Icons;
}
export declare function iconToString(icon: Cheerio): string;
export declare function loadIcons(configuration: Configuration): Icons;
