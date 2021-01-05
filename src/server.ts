import { readFile } from 'fs/promises'
import globby from 'globby'
import { resolve } from 'path'
import { runHook } from './environment'
import { Options, Server } from './types'

export async function setupServer(options: Options): Promise<any> {
  const serverOptions: Server = options.server ?? {}

  let https: boolean
  let cert: string | undefined
  let privkey: string | undefined

  if (!('https' in serverOptions)) {
    // Autodetect HTTPS
    cert = (await globby(resolve(process.cwd(), './config/ssl/(certificate|cert).pem'))).pop()
    privkey = (await globby(resolve(process.cwd(), './config/ssl/(private-key|privkey).pem'))).pop()
    https = !!(cert && privkey)
  } else {
    https = (serverOptions.https as boolean) ?? false
  }

  const config: any = {
    host: serverOptions.host ?? 'home.cowtech.it',
    port: serverOptions.port ?? 4200,
    https,
    compress: serverOptions.compress ?? true,
    historyApiFallback: serverOptions.history ?? true,
    firewall: serverOptions.firewall ?? true,
    ...(serverOptions.options ?? {})
  }

  if (config.https) {
    config.https = {
      key: await readFile(config.https?.key ?? privkey),
      cert: await readFile(config.https?.cert ?? cert)
    }
  }

  return runHook(config, serverOptions.afterHook)
}
