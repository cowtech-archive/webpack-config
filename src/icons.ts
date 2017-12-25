import * as cheerio from 'cheerio';
import {readFileSync} from 'fs';

import {Configuration, loadConfigurationEntry} from './configuration';

export interface Icons{
  tags: {[key: string]: string};
  definitions: string;
}

export interface IconsLoader{
  loader?(toLoad: Array<string>, loaderConfiguration?: IconsLoader): Icons;
  afterHook?(icons: Icons): Icons;
}

export function loadSVGFile(path: string, tag: string): Cheerio{
  const icon: Cheerio = cheerio.load(readFileSync(path, 'utf-8'))('svg');

  icon.attr('id', tag);
  for(const attr of ['width', 'height'])
    icon.removeAttr(attr);

  return icon;
}

export function iconToString(icon: Cheerio): string{
  // Save the definition - as any is needed since .wrap is not in the type definitions yet
  return (icon as any).wrap('<div/>').parent().html().replace(/\n/mg, '').replace(/^\s+/mg, '');
}

export function loadIcons(configuration: Configuration): Icons{
  const toLoad: Array<string> = loadConfigurationEntry('icons', configuration);
  const iconsLoader: IconsLoader = loadConfigurationEntry('iconsLoader', configuration);
  let icons: Icons = typeof iconsLoader.loader === 'function' ? iconsLoader.loader(toLoad, iconsLoader) : {tags: {}, definitions: ''};

  if(typeof iconsLoader.afterHook === 'function')
    icons = iconsLoader.afterHook(icons);

  return icons;
}
