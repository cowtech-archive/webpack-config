import {Configuration, loadConfigurationEntry} from './configuration';

export interface Icons{
  tags: {[key: string]: string};
  definitions: string;
}

export interface IconsLoader{
  loader?(toLoad: Array<string>, loaderConfiguration?: IconsLoader): Icons;
  afterHook?(icons: Icons): Icons;
}

export function loadIcons(configuration: Configuration): Icons{
  const toLoad = loadConfigurationEntry<Array<string>>('icons', configuration);
  const iconsLoader = loadConfigurationEntry<IconsLoader>('iconsLoader', configuration);
  let icons = typeof iconsLoader.loader === 'function' ? iconsLoader.loader(toLoad, iconsLoader) : {tags: {}, definitions: ''};

  if(typeof iconsLoader.afterHook === 'function')
    icons = iconsLoader.afterHook(icons);

  return icons;
}
