import { globby } from 'globby'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { runHook } from './environment.js'
import { Options, Server } from './types.js'

export async function setupServer(options: Options): Promise<any> {
  let { https, ...serverOptions }: Server = options.server ?? {}

  let cert: string | undefined
  let key: string | undefined

  // Autodetect HTTPS
  if (typeof https === 'undefined') {
    const certFile = await globby(resolve(process.cwd(), './config/ssl/(certificate|cert).pem'))
    const keyFile = await globby(resolve(process.cwd(), './config/ssl/(private-key|privkey).pem'))

    cert = certFile.pop()
    key = keyFile.pop()
    https = !!(cert && key)
  }

  const config: any = {
    host: serverOptions.host ?? 'home.cowtech.it',
    port: serverOptions.port ?? 4200,
    server: 'http',
    compress: serverOptions.compress ?? true,
    historyApiFallback: serverOptions.history ?? true,
    ...serverOptions.options
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
