import { readFile } from 'fs/promises'
import { globby } from 'globby'
import { resolve } from 'path'
import { runHook } from './environment'
import { Options, Server } from './types'

export async function setupServer(options: Options): Promise<any> {
  let { https, ...serverOptions }: Server = options.server ?? {}

  let cert: string | undefined
  let key: string | undefined

  // Autodetect HTTPS
  if (typeof https === 'undefined') {
    cert = (await globby(resolve(process.cwd(), './config/ssl/(certificate|cert).pem'))).pop()
    key = (await globby(resolve(process.cwd(), './config/ssl/(private-key|privkey).pem'))).pop()
    https = !!(cert && key)
  }

  const config: any = {
    host: serverOptions.host ?? 'home.cowtech.it',
    port: serverOptions.port ?? 4200,
    server: 'http',
    compress: serverOptions.compress ?? true,
    historyApiFallback: serverOptions.history ?? true,
    ...(serverOptions.options ?? {})
  }

  if (https) {
    config.server = {
      type: 'https',
      options: {
        key: await readFile(config.https?.key ?? key),
        cert: await readFile(config.https?.cert ?? cert)
      }
    }
  }

  return runHook(config, serverOptions.afterHook)
}
