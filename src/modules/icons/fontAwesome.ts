import { camelCase } from 'lodash'
import { resolve } from 'path'
import { Icons } from '../types'

// Fields: viewBoxWidth, viewBoxHeight, unused, unicodeCode, SVG path
type IconDefinition = [number, number, Array<any>, string, string]

interface Icon {
  prefix: string
  iconName: string
  icon: IconDefinition
}

interface Tags {
  [key: string]: string
}

function generateSVG(icon: Icon, tag: string): string {
  const def = icon.icon

  return `<svg id="${tag}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def[0]} ${
    def[1]
  }"><path fill="currentColor" d="${def[4]}"></path></svg>`
}

export async function loadFontAwesomeIcons(icons: Icons, toLoad: Array<string>): Promise<void> {
  const dependencies: { [key: string]: string } = require(resolve(process.cwd(), './package.json')).dependencies

  icons.tags = toLoad.reduce<Tags>((accu, entry, index) => {
    // Manipulate the icon name - Syntax: [alias@]<icon>[:section]
    const [alias, rawName] = entry.includes('@') ? entry.split('@') : [entry.replace(/:.+/, ''), entry]
    const [name, section] = rawName.includes(':') ? rawName.split(':') : [rawName, 'solid']
    const tag = `i${index}`
    const iconPackage = `@fortawesome/fontawesome-free-${section}`

    // Check font-awesome exists in dependencies
    if (!dependencies.hasOwnProperty(iconPackage)) {
      throw new Error(
        `In order to load the "${entry}" icon, please add ${iconPackage} to the package.json dependencies.`
      )
    }

    // Load the icon then add to the definitions
    const icon = require(resolve(process.cwd(), `node_modules/${iconPackage}/${camelCase(`fa_${name}`)}`))
    icons.definitions += generateSVG(icon, tag)
    accu[alias] = tag

    return accu
  }, {})
}
