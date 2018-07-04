// @ts-ignore
import * as history from 'connect-history-api-fallback'
import { readFile } from 'fs-extra'
import * as globby from 'globby'
import { default as Application, Middleware } from 'koa'
// @ts-ignore
import * as convert from 'koa-connect'
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
    hot: get(serverOptions, 'hot', true),
    add(app: Application, middleware: Middleware, options: object) {
      const add = get(serverOptions, 'add', null)
      let historyOptions = get(serverOptions, 'history', true)

      if (historyOptions) {
        if (typeof historyOptions === 'boolean') historyOptions = {}

        app.use(convert(history(historyOptions)))
      }

      if (typeof add === 'function') {
        add(app, middleware, options)
      }
    }
  }

  if (config.hot === true) {
    config.hot = {
      https: !!config.https,
      port: config.port + 1
    }
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
