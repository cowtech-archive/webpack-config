import { resolve } from 'path'
import { Icons } from './types'

export interface Icon {
  width: number
  height: number
  svgPathData: string
}

export interface Tags {
  [key: string]: string
}

function camelCase(source: any): string {
  // tslint:disable-next-line strict-type-predicates
  if (typeof source !== 'string' || !source.length) {
    return source
  }

  return source
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/(^.|\s.)/g, (...t: Array<string>) => t[1].toUpperCase())
}

export function generateSVG(icon: Icon, tag: string): string {
  const { width, height, svgPathData } = icon

  return `
    <svg id="${tag}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <path fill="currentColor" d="${svgPathData}"></path>
    </svg>
  `
}

export async function loadFontAwesomeIcons(icons: Icons, toLoad: Array<string>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dependencies: { [key: string]: string } = require(resolve(process.cwd(), './package.json')).dependencies

  icons.tags = toLoad.reduce<Tags>((accu: Tags, entry: string, index: number) => {
    // Manipulate the icon name - Syntax: [alias@]<icon>[:section]
    const [alias, rawName] = entry.includes('@') ? entry.split('@') : [entry.replace(/:.+/, ''), entry]
    const [name, section] = rawName.includes(':') ? rawName.split(':') : [rawName, 'solid']
    const tag = `i${index}`
    const iconPackage = `@fortawesome/free-${section}-svg-icons`

    // Check font-awesome exists in dependencies
    if (!(iconPackage in dependencies)) {
      throw new Error(
        `In order to load the "${entry}" icon, please add ${iconPackage} to the package.json dependencies.`
      )
    }

    // Load the icon then add to the definitions
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const icon = require(resolve(
      process.cwd(),
      `node_modules/${iconPackage}/fa${camelCase(`${name}`).replace(/\s/g, '')}`
    ))
    icons.definitions += generateSVG(icon, tag)
    accu[alias] = tag

    return accu
  }, {})
}
