"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_get_1 = __importDefault(require("lodash.get"));
const fontAwesome_1 = require("./icons/fontAwesome");
var fontAwesome_2 = require("./icons/fontAwesome");
exports.generateFontAwesomeSVG = fontAwesome_2.generateSVG;
exports.loadFontAwesomeIcons = fontAwesome_2.loadFontAwesomeIcons;
async function loadIcons(options) {
    const toLoad = lodash_get_1.default(options, 'icons', {});
    let icons = { tags: {}, definitions: '' };
    // Font Awesome
    if (toLoad.fontawesome) {
        await fontAwesome_1.loadFontAwesomeIcons(icons, toLoad.fontawesome);
    }
    return icons;
}
exports.loadIcons = loadIcons;
