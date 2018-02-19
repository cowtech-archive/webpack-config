import {resolve} from 'path';

import {Configuration, loadConfigurationEntry} from './configuration';

export function loadEnvironment(configuration: Configuration): any{
  const packageInfo = require(resolve(process.cwd(), './package.json'));
  const environment = loadConfigurationEntry('environment', configuration);
  const version = loadConfigurationEntry('version', configuration);
  const sw = loadConfigurationEntry<ServiceWorker | boolean>('serviceWorker', configuration);

  if(!packageInfo.site)
    packageInfo.site = {};

  return {
    environment,
    serviceWorkerEnabled: sw !== false,
    version: version || new Date().toISOString().replace(/([-:])|(\.\d+Z$)/g, '').replace('T', '.'),
    ...(packageInfo.site.common || {}),
    ...(packageInfo.site[environment] || {})
  };
}
