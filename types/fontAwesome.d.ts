import { Icons } from './types';
export interface Icon {
    width: number;
    height: number;
    svgPathData: string;
}
export interface Tags {
    [key: string]: string;
}
export declare function generateSVG(icon: Icon, tag: string): string;
export declare function loadFontAwesomeIcons(icons: Icons, toLoad: Array<string>): Promise<void>;
