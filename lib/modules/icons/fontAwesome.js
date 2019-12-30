"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const utils_1 = require("../utils");
function generateSVG(icon, tag) {
    const { width, height, svgPathData } = icon;
    return `
    <svg id="${tag}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <path fill="currentColor" d="${svgPathData}"></path>
    </svg>
  `;
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
        const icon = require(path_1.resolve(process.cwd(), `node_modules/${iconPackage}/fa${utils_1.camelCase(`${name}`).replace(/\s/g, '')}`));
        icons.definitions += generateSVG(icon, tag);
        accu[alias] = tag;
        return accu;
    }, {});
}
exports.loadFontAwesomeIcons = loadFontAwesomeIcons;
