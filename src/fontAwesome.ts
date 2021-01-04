import { parse } from '@babel/parser'
import { Identifier, NumericLiteral, Statement, StringLiteral, VariableDeclaration } from '@babel/types'
import { readFileSync } from 'fs'
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

function findVariable<Type extends NumericLiteral | StringLiteral>(
  statements: Array<Statement>,
  id: string
): number | string {
  const declaration = statements.find(
    (t: Statement) => t.type === 'VariableDeclaration' && (t.declarations[0].id as Identifier).name === id
  )!

  return ((((declaration as unknown) as VariableDeclaration).declarations[1].init as unknown) as Type).value
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
  const dependencies: { [key: string]: string } = JSON.parse(
    readFileSync(resolve(process.cwd(), './package.json'), 'utf-8')
  ).dependencies

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
    const iconFile = resolve(
      process.cwd(),
      `node_modules/${iconPackage}/fa${camelCase(`${name}`).replace(/\s/g, '')}.js`
    )
    const iconData = parse(readFileSync(iconFile, 'utf-8')).program.body

    icons.definitions += generateSVG(
      {
        width: findVariable<NumericLiteral>(iconData, 'width') as number,
        height: findVariable<NumericLiteral>(iconData, 'height') as number,
        svgPathData: findVariable<StringLiteral>(iconData, 'svgPathData') as string
      },
      tag
    )

    accu[alias] = tag

    return accu
  }, {})
}
