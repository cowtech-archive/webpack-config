import { load } from 'js-yaml'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Environment, Hook, Options } from './types.js'

export function setupEnvironment(options: Options): Environment {
  const environment = options.environment as string

  let commonSettings: object = {}
  let environmentSettings: object = {}

  // Load settings from config/application.yml or from site key in package.json
  const yamlPath = resolve(process.cwd(), './config/application.yml')

  // Load from YAML file
  if (existsSync(yamlPath)) {
    const configuration = load(readFileSync(yamlPath, 'utf8')) as { [key: string]: object | undefined }
    commonSettings = configuration.common ?? {}
    environmentSettings = configuration[environment] ?? {}
    // Legacy package.json based configuration
  } else {
    const packageInfo = JSON.parse(readFileSync(resolve(process.cwd(), './package.json'), 'utf8'))
    commonSettings = packageInfo.site?.common ?? {}
    environmentSettings = packageInfo.site?.[environment] ?? {}
  }

  return {
    environment,
    version: options.version as string,
    serviceWorkerEnabled: options?.serviceWorker?.enabled ?? options.environment === 'production',
    ...commonSettings,
    ...environmentSettings,
    ...options.additionalEnvironment
  }
}

export async function runHook<T>(input: T, hook?: Hook<T>): Promise<T> {
  if (typeof hook !== 'function') {
    return input
  }

  const output = await hook(input)
  return (output as T) ?? input
}
