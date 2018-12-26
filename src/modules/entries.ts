import globby from 'globby'
import { resolve } from 'path'
import { Entries, Options } from './types'

export async function autoDetectEntries(options: Options): Promise<Entries> {
  const attempts = {
    bundle: await globby(resolve(options.srcFolder!, 'bundle.(js|ts)')),
    application: await globby(resolve(options.srcFolder!, 'js/(application|app).(js|ts|jsx|tsx)'))
  }

  if (attempts.bundle.length) {
    return { 'bundle.js': attempts.bundle[0] }
  } else if (attempts.application.length) {
    return { 'js/app.js': attempts.application[0] }
  }

  throw new Error('Unable to autodetect the main entry file. Please specify entries manually.')
}
