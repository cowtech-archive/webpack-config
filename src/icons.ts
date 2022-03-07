import { loadFontAwesomeIcons } from './fontAwesome.js'
import { Icons, IconsToLoad, Options } from './types.js'

export {
  generateSVG as generateFontAwesomeSVG,
  Icon as FontAwesomeIcon,
  loadFontAwesomeIcons,
  Tags as FontAwesomeTags
} from './fontAwesome.js'

export async function loadIcons(options: Options): Promise<Icons> {
  const toLoad = (options.icons ?? {}) as IconsToLoad
  const icons: Icons = { tags: {}, definitions: '' }

  // Font Awesome
  if (toLoad.fontawesome) {
    await loadFontAwesomeIcons(icons, toLoad.fontawesome)
  }

  return icons
}
