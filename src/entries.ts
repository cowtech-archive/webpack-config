import globby from 'globby'
import { resolve } from 'path'
import { Options } from './types'

export async function autoDetectEntries(options: Options): Promise<{ [key: string]: string }> {
  const attempts = {
    bundle: await globby(resolve(options.srcFolder!, 'bundle.(js|ts)')),
    application: await globby(resolve(options.srcFolder!, 'js/(application|app).(js|ts|jsx|tsx)'))
  }

  const entries: { [key: string]: string } = {}

  if (attempts.bundle.length) {
    entries.bundle = attempts.bundle[0]
  } else if (attempts.application.length) {
    entries['js/app'] = attempts.application[0]
  } else {
    throw new Error('Unable to autodetect the main entry file. Please specify entries manually.')
  }

  return entries
}
