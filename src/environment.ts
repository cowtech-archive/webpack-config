import {resolve} from 'path';

import {Configuration, loadConfigurationEntry} from './configuration';

export function loadEnvironment(configuration: Configuration): any{
  const packageInfo: any = require(resolve(process.cwd(), './package.json'));
  const environment: string = loadConfigurationEntry('environment', configuration);
  const version: string = loadConfigurationEntry('version', configuration);
  const sw: ServiceWorker | boolean = loadConfigurationEntry('serviceWorker', configuration);

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
