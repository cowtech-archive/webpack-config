import { Icons } from '../types';
declare type IconDefinition = [number, number, Array<any>, string, string];
export interface Icon {
    prefix: string;
    iconName: string;
    icon: IconDefinition;
}
export interface Tags {
    [key: string]: string;
}
export declare function generateSVG(icon: Icon, tag: string): string;
export declare function loadFontAwesomeIcons(icons: Icons, toLoad: Array<string>): Promise<void>;
export {};
