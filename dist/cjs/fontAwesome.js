"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFontAwesomeIcons = exports.generateSVG = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function camelCase(source) {
    // tslint:disable-next-line strict-type-predicates
    if (typeof source !== 'string' || !source.length) {
        return source;
    }
    return source
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/(^.|\s.)/g, (...t) => t[1].toUpperCase());
}
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
    const dependencies = JSON.parse(fs_1.readFileSync(path_1.resolve(process.cwd(), './package.json'), 'utf-8')).dependencies;
    for (let i = 0; i < toLoad.length; i++) {
        const entry = toLoad[i];
        // Manipulate the icon name - Syntax: [alias@]<icon>[:section]
        const [alias, rawName] = entry.includes('@') ? entry.split('@') : [entry.replace(/:.+/, ''), entry];
        const [name, section] = rawName.includes(':') ? rawName.split(':') : [rawName, 'solid'];
        const tag = `i${i}`;
        const iconPackage = `@fortawesome/free-${section}-svg-icons`;
        // Check font-awesome exists in dependencies
        if (!(iconPackage in dependencies)) {
            throw new Error(`In order to load the "${entry}" icon, please add ${iconPackage} to the package.json dependencies.`);
        }
        // Load the icon then add to the definitions
        const iconFile = await Promise.resolve().then(() => __importStar(require(path_1.resolve(process.cwd(), `node_modules/${iconPackage}/fa${camelCase(`${name}`).replace(/\s/g, '')}.js`))));
        icons.definitions += generateSVG(iconFile, tag);
        icons.tags[alias] = tag;
    }
}
exports.loadFontAwesomeIcons = loadFontAwesomeIcons;
