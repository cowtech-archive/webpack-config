// @ts-ignore
import { readFile } from 'fs-extra'
import globby from 'globby'
import { resolve } from 'path'
import { runHook } from './environment'
import { Options, Server } from './types'

export async function setupServer(options: Options): Promise<any> {
  const serverOptions: Server = options.server ?? {}

  let https: boolean

  if (!serverOptions.hasOwnProperty('https')) {
    // Autodetect HTTPS
    https = (await globby(resolve(process.cwd(), './config/ssl/(private-key|certificate).pem'))).length === 2
  } else {
    https = (serverOptions.https as boolean) ?? false
  }

  let config: any = {
    host: serverOptions.host ?? 'home.cowtech.it',
    port: serverOptions.port ?? 4200,
    https,
    compress: serverOptions.compress ?? true,
    historyApiFallback: serverOptions.history ?? true,
    disableHostCheck: serverOptions.disableHostCheck ?? true,
    inline: serverOptions.inline ?? true,
    ...(serverOptions.options ?? {})
  }

  if (config.https) {
    config.https = {
      key: await readFile(resolve(process.cwd(), config.https?.key ?? './config/ssl/private-key.pem')),
      cert: await readFile(resolve(process.cwd(), config.https?.cert ?? './config/ssl/certificate.pem'))
    }
  }

  return runHook(config, serverOptions.afterHook)
}
