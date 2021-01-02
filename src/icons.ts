import { loadFontAwesomeIcons } from './fontAwesome'
import { Icons, IconsToLoad, Options } from './types'

export {
  generateSVG as generateFontAwesomeSVG,
  Icon as FontAwesomeIcon,
  loadFontAwesomeIcons,
  Tags as FontAwesomeTags
} from './fontAwesome'

export async function loadIcons(options: Options): Promise<Icons> {
  const toLoad = (options.icons ?? {}) as IconsToLoad
  const icons: Icons = { tags: {}, definitions: '' }

  // Font Awesome
  if (toLoad.fontawesome) {
    await loadFontAwesomeIcons(icons, toLoad.fontawesome)
  }

  return icons
}
