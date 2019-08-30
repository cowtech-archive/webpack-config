import globby from 'globby'
import get from 'lodash.get'
import { resolve } from 'path'
import { Entries, Options } from './types'

export async function autoDetectEntries(options: Options): Promise<Entries> {
  const attempts = {
    bundle: await globby(resolve(options.srcFolder!, 'bundle.(js|ts)')),
    application: await globby(resolve(options.srcFolder!, 'js/(application|app).(js|ts|jsx|tsx)'))
  }

  const mainExtension = get(options, 'useESModules', true) ? 'mjs' : 'js'
  const entries: { [key: string]: string } = {}

  if (attempts.bundle.length) {
    entries['bundle.js'] = attempts.bundle[0]
  } else if (attempts.application.length) {
    entries[`js/app.${mainExtension}`] = attempts.application[0]
  } else {
    throw new Error('Unable to autodetect the main entry file. Please specify entries manually.')
  }

  return entries
}
