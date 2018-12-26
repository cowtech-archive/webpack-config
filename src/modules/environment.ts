import get from 'lodash.get'
import { resolve } from 'path'
import { Environment, Options } from './types'

export function setupEnvironment(options: Options): Environment {
  const packageInfo = require(resolve(process.cwd(), './package.json'))
  const environment = options.environment

  return {
    environment,
    version: options.version,
    serviceWorkerEnabled: get(options.serviceWorker, 'enabled', options.environment === 'production'),
    ...get(packageInfo, 'site.common', {}),
    ...get(packageInfo, `site.${environment}`, {}),
    ...get(options, 'additionalEnvironment', {})
  }
}
