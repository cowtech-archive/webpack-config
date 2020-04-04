"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fontAwesome_1 = require("./icons/fontAwesome");
var fontAwesome_2 = require("./icons/fontAwesome");
exports.generateFontAwesomeSVG = fontAwesome_2.generateSVG;
exports.loadFontAwesomeIcons = fontAwesome_2.loadFontAwesomeIcons;
async function loadIcons(options) {
    var _a;
    const toLoad = (_a = options.icons, (_a !== null && _a !== void 0 ? _a : {}));
    const icons = { tags: {}, definitions: '' };
    // Font Awesome
    if (toLoad.fontawesome) {
        await fontAwesome_1.loadFontAwesomeIcons(icons, toLoad.fontawesome);
    }
    return icons;
}
exports.loadIcons = loadIcons;
