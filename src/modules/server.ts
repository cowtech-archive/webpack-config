import { readFile } from 'fs-extra'
import globby from 'globby'
import { get } from 'lodash'
import { resolve } from 'path'
import { Options, Server } from './types'

export async function setupServer(options: Options): Promise<any> {
  const serverOptions: Server = options.server || {}

  let https: boolean

  if (!serverOptions.hasOwnProperty('https')) {
    // Autodetect HTTPS
    https = (await globby(resolve(process.cwd(), './config/ssl/(private-key|certificate).pem'))).length === 2
  } else {
    https = get(serverOptions, 'https', false) as boolean
  }

  let config: any = {
    host: get(serverOptions, 'host', 'home.cowtech.it'),
    port: get(serverOptions, 'port', 4200),
    https,
    compress: get(serverOptions, 'compress', true),
    hot: get(serverOptions, 'hot', true)
  }

  if (config.https) {
    config.https = {
      key: await readFile(resolve(process.cwd(), get(config.https, 'key', './config/ssl/private-key.pem'))),
      cert: await readFile(resolve(process.cwd(), get(config.https, 'cert', './config/ssl/certificate.pem')))
    }
  }

  if (typeof serverOptions.afterHook === 'function') config = await serverOptions.afterHook(config)

  return config
}
