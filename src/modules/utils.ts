export function upperFirst(source: any): string {
  // tslint:disable-next-line strict-type-predicates
  if (typeof source !== 'string' || !source.length) {
    return source
  }

  return source[0].toUpperCase() + source.substring(1)
}

export function camelCase(source: any): string {
  // tslint:disable-next-line strict-type-predicates
  if (typeof source !== 'string' || !source.length) {
    return source
  }

  return source
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/(^.|\s.)/g, (...t: Array<string>) => t[1].toUpperCase())
}

export function get<T>(target: any, path: string, def?: T): T | undefined {
  const tokens = path.split('.').map((t: string) => t.trim())

  for (const token of tokens) {
    if (typeof target === 'undefined' || target === null) {
      // We're supposed to be still iterating, but the chain is over - Return undefined
      target = def
      break
    }

    const index = token.match(/^(\d+)|(?:\[(\d+)\])$/)
    if (index) {
      target = target[parseInt(index[1] || index[2], 10)]
    } else {
      target = target[token]
    }
  }

  return target
}
