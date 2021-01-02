"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadIcons = exports.loadFontAwesomeIcons = exports.generateFontAwesomeSVG = void 0;
const fontAwesome_1 = require("./fontAwesome");
var fontAwesome_2 = require("./fontAwesome");
Object.defineProperty(exports, "generateFontAwesomeSVG", { enumerable: true, get: function () { return fontAwesome_2.generateSVG; } });
Object.defineProperty(exports, "loadFontAwesomeIcons", { enumerable: true, get: function () { return fontAwesome_2.loadFontAwesomeIcons; } });
async function loadIcons(options) {
    var _a;
    const toLoad = ((_a = options.icons) !== null && _a !== void 0 ? _a : {});
    const icons = { tags: {}, definitions: '' };
    // Font Awesome
    if (toLoad.fontawesome) {
        await fontAwesome_1.loadFontAwesomeIcons(icons, toLoad.fontawesome);
    }
    return icons;
}
exports.loadIcons = loadIcons;
