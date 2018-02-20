import * as webpack from 'webpack';

import {Configuration, defaultConfiguration, loadConfigurationEntry} from './configuration';

export interface ServiceWorker{
  source?: string;
  dest?: string;
  include?: Array<string | RegExp>;
  exclude?: Array<string | RegExp>;
  templatedUrls?: {[key: string]: string | Array<string>};
  afterHook?(config: any): any;
}

const {InjectManifest} = require('workbox-webpack-plugin');

export function setupServiceWorker(config: webpack.Configuration, configuration: Configuration): webpack.Configuration{
  const options = loadConfigurationEntry<ServiceWorker | boolean>('serviceWorker', configuration);
  const srcFolder = loadConfigurationEntry('srcFolder', configuration);
  const destFolder = loadConfigurationEntry('destFolder', configuration);

  const source = loadConfigurationEntry('source', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const dest = loadConfigurationEntry('dest', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const include = loadConfigurationEntry<Array<string | RegExp>>('include', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const exclude = loadConfigurationEntry<Array<string | RegExp>>('exclude', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const templatedUrls = loadConfigurationEntry<Array<string>>('templatedUrls', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);

  if(options === false)
    return config;

  let pluginConfig: any = {swSrc: `${srcFolder}/${source}`, swdest: `${destFolder}/${dest}`, include, exclude, templatedUrls};

  if(typeof (options as ServiceWorker).afterHook === 'function')
    pluginConfig = (options as ServiceWorker).afterHook(pluginConfig);

  if(pluginConfig.templatedUrls && !pluginConfig.globDirectory)
    pluginConfig.globDirectory = srcFolder;

  config.plugins.push(new InjectManifest(pluginConfig));

  return config;
}
