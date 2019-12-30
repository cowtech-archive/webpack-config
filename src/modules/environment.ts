import { resolve } from 'path'
import { Environment, Hook, Options } from './types'
import { get } from './utils'

export function setupEnvironment(options: Options): Environment {
  const packageInfo = require(resolve(process.cwd(), './package.json'))
  const environment = options.environment as string

  return {
    environment,
    version: options.version as string,
    serviceWorkerEnabled: get(options.serviceWorker, 'enabled', options.environment === 'production')!,
    ...get(packageInfo, 'site.common', {}),
    ...get(packageInfo, `site.${environment}`, {}),
    ...get(options, 'additionalEnvironment', {})
  }
}

export async function runHook<T>(input: T, hook?: Hook<T>): Promise<T> {
  if (typeof hook !== 'function') {
    return input
  }

  const output = await hook(input)
  return output ? output : input
}
