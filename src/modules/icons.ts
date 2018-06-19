import { get } from 'lodash'
import { loadFontAwesomeIcons } from './icons/fontAwesome'
import { Icons, IconsToLoad, Options } from './types'

export async function loadIcons(options: Options): Promise<Icons> {
  const toLoad = get(options, 'icons', {}) as IconsToLoad
  let icons: Icons = { tags: {}, definitions: '' }

  // Font Awesome
  if (toLoad.fontawesome) await loadFontAwesomeIcons(icons, toLoad.fontawesome)

  return icons
}
