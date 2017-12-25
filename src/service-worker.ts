import * as webpack from 'webpack';

import {Configuration, defaultConfiguration, loadConfigurationEntry} from './configuration';

export interface ServiceWorker{
  template?: string;
  source?: string;
  dest?: string;
  patterns?: Array<string | RegExp>;
  ignores?: Array<string | RegExp>;
  templatedUrls?: {[key: string]: string | Array<string>};
  afterHook?(plugin: any): any;
}

const WorkboxPlugin = require('workbox-webpack-plugin');

export function setupServiceWorker(config: webpack.Configuration, configuration: Configuration): webpack.Configuration{
  const options: ServiceWorker | boolean = loadConfigurationEntry('serviceWorker', configuration);
  const distFolder: string = loadConfigurationEntry('distFolder', configuration);

  const source: string = loadConfigurationEntry('source', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const dest: string = loadConfigurationEntry('dest', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const globPatterns: Array<string> = loadConfigurationEntry('patterns', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const globIgnores: Array<string> = loadConfigurationEntry('ignores', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const templatedUrls: Array<string> = loadConfigurationEntry('templatedUrls', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const transpilers: Array<string> = loadConfigurationEntry('transpilers', configuration);

  if(options === false)
    return config;

  (config.entry as webpack.Entry)[dest] = (options as ServiceWorker).template || `./src/js/service-worker.${transpilers.includes('typescript') ? 'ts' : 'js'}`;
  (config.module as webpack.NewModule).rules.unshift(
    {
      test: /workbox-sw\.[a-z]+\..+\.js$/,
      use: [{loader: 'file-loader', options: {name: 'js/workbox.js'}}, {loader: 'babel-loader', options: {presets: ['minify', {comments: false}]}}]
    }
  );

  let plugin: any = new WorkboxPlugin({swSrc: `${distFolder}/${source}`, swDest: `${distFolder}/${dest}`, globPatterns, globIgnores, templatedUrls});

  if(typeof (options as ServiceWorker).afterHook === 'function')
    plugin = (options as ServiceWorker).afterHook(plugin);

  config.plugins.push(plugin);

  return config;
}
