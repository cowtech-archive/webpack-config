import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Icons } from './types.js'

export interface FontAwesomeIcon {
  width: number
  height: number
  svgPathData: string
}

export interface FontAwesomeTags {
  [key: string]: string
}

function camelCase(source: any): string {
  if (typeof source !== 'string' || !source.length) {
    return source
  }

  return source
    .toLowerCase()
    .replace(/[^\d\sa-z]/g, ' ')
    .replace(/(^.|\s.)/g, (...t) => t[1].toUpperCase())
}

export function generateFontAwesomeSVG(icon: FontAwesomeIcon, tag: string): string {
  const { width, height, svgPathData } = icon

  return `
    <svg id="${tag}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <path fill="currentColor" d="${svgPathData}"></path>
    </svg>
  `
}

export async function loadFontAwesomeIcons(icons: Icons, toLoad: Array<string>): Promise<void> {
  const dependencies: { [key: string]: string } = JSON.parse(
    readFileSync(resolve(process.cwd(), './package.json'), 'utf8')
  ).dependencies

  for (let i = 0; i < toLoad.length; i++) {
    const entry = toLoad[i]

    // Manipulate the icon name - Syntax: [alias@]<icon>[:section]
    const [alias, rawName] = entry.includes('@') ? entry.split('@') : [entry.replace(/:.+/, ''), entry]
    const [name, section] = rawName.includes(':') ? rawName.split(':') : [rawName, 'solid']
    const tag = `i${i}`
    const iconPackage = `@fortawesome/free-${section}-svg-icons`

    // Check font-awesome exists in dependencies
    if (!(iconPackage in dependencies)) {
      throw new Error(
        `In order to load the "${entry}" icon, please add ${iconPackage} to the package.json dependencies.`
      )
    }

    // Load the icon then add to the definitions
    const iconFile: FontAwesomeIcon = await import(
      resolve(process.cwd(), `node_modules/${iconPackage}/fa${camelCase(`${name}`).replace(/\s/g, '')}.js`)
    )

    icons.definitions += generateFontAwesomeSVG(iconFile, tag)
    icons.tags[alias] = tag
  }
}
