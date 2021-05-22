import { loadFontAwesomeIcons } from "./fontAwesome.js";
export { generateSVG as generateFontAwesomeSVG, loadFontAwesomeIcons } from "./fontAwesome.js";
export async function loadIcons(options) {
    var _a;
    const toLoad = ((_a = options.icons) !== null && _a !== void 0 ? _a : {});
    const icons = { tags: {}, definitions: '' };
    // Font Awesome
    if (toLoad.fontawesome) {
        await loadFontAwesomeIcons(icons, toLoad.fontawesome);
    }
    return icons;
}
