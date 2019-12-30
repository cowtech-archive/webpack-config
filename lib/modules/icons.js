"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fontAwesome_1 = require("./icons/fontAwesome");
const utils_1 = require("./utils");
var fontAwesome_2 = require("./icons/fontAwesome");
exports.generateFontAwesomeSVG = fontAwesome_2.generateSVG;
exports.loadFontAwesomeIcons = fontAwesome_2.loadFontAwesomeIcons;
async function loadIcons(options) {
    const toLoad = utils_1.get(options, 'icons', {});
    let icons = { tags: {}, definitions: '' };
    // Font Awesome
    if (toLoad.fontawesome) {
        await fontAwesome_1.loadFontAwesomeIcons(icons, toLoad.fontawesome);
    }
    return icons;
}
exports.loadIcons = loadIcons;
