import { Compilation } from 'webpack'
import { WebpackCliEnvironment } from './types'

export const scriptUrlSuffix = /-(?:(?:[a-f0-9]+)\.mjs)$/i

export function generateVersion(): string {
  return new Date()
    .toISOString()
    .replace(/([-:])|(\.\d+Z$)/g, '')
    .replace('T', '.')
}

export function normalizeWebpackEnvironment(env: WebpackCliEnvironment): 'production' | 'development' {
  return env.production === true ? 'production' : 'development'
}

export function findScriptUrl(compilation: Compilation, path: string, suffixPattern?: RegExp): string | undefined {
  if (!suffixPattern) {
    suffixPattern = scriptUrlSuffix
  }

  const files = compilation.entrypoints.get(path)?.getFiles()

  if (!files) {
    return undefined
  }

  const url = files.find((f: string) => f.startsWith(path) && suffixPattern!.test(f))
  return `/${url}`
}
