"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const path_1 = require("path");
function generateSVG(icon, tag) {
    const def = icon.icon;
    return `<svg id="${tag}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def[0]} ${def[1]}"><path fill="currentColor" d="${def[4]}"></path></svg>`;
}
exports.generateSVG = generateSVG;
async function loadFontAwesomeIcons(icons, toLoad) {
    const dependencies = require(path_1.resolve(process.cwd(), './package.json')).dependencies;
    icons.tags = toLoad.reduce((accu, entry, index) => {
        // Manipulate the icon name - Syntax: [alias@]<icon>[:section]
        const [alias, rawName] = entry.includes('@') ? entry.split('@') : [entry.replace(/:.+/, ''), entry];
        const [name, section] = rawName.includes(':') ? rawName.split(':') : [rawName, 'solid'];
        const tag = `i${index}`;
        const iconPackage = `@fortawesome/free-${section}-svg-icons`;
        // Check font-awesome exists in dependencies
        if (!dependencies.hasOwnProperty(iconPackage)) {
            throw new Error(`In order to load the "${entry}" icon, please add ${iconPackage} to the package.json dependencies.`);
        }
        // Load the icon then add to the definitions
        const icon = require(path_1.resolve(process.cwd(), `node_modules/${iconPackage}/${lodash_1.camelCase(`fa_${name}`)}`));
        icons.definitions += generateSVG(icon, tag);
        accu[alias] = tag;
        return accu;
    }, {});
}
exports.loadFontAwesomeIcons = loadFontAwesomeIcons;
