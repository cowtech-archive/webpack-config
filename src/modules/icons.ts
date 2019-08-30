import get from 'lodash.get'
import { loadFontAwesomeIcons } from './icons/fontAwesome'
import { Icons, IconsToLoad, Options } from './types'

export {
  generateSVG as generateFontAwesomeSVG,
  Icon as FontAwesomeIcon,
  loadFontAwesomeIcons,
  Tags as FontAwesomeTags
} from './icons/fontAwesome'

export async function loadIcons(options: Options): Promise<Icons> {
  const toLoad = get(options, 'icons', {}) as IconsToLoad
  let icons: Icons = { tags: {}, definitions: '' }

  // Font Awesome
  if (toLoad.fontawesome) {
    await loadFontAwesomeIcons(icons, toLoad.fontawesome)
  }

  return icons
}
