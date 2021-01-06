"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findScriptUrl = exports.normalizeWebpackEnvironment = exports.generateVersion = exports.scriptUrlSuffix = void 0;
exports.scriptUrlSuffix = /-(?:(?:[a-f0-9]+)\.mjs)$/i;
function generateVersion() {
    return new Date()
        .toISOString()
        .replace(/([-:])|(\.\d+Z$)/g, '')
        .replace('T', '.');
}
exports.generateVersion = generateVersion;
function normalizeWebpackEnvironment(env) {
    return env.production === true ? 'production' : 'development';
}
exports.normalizeWebpackEnvironment = normalizeWebpackEnvironment;
function findScriptUrl(compilation, path, suffixPattern) {
    var _a;
    if (!suffixPattern) {
        suffixPattern = exports.scriptUrlSuffix;
    }
    const files = (_a = compilation.entrypoints.get(path)) === null || _a === void 0 ? void 0 : _a.getFiles();
    if (!files) {
        return undefined;
    }
    const url = files.find((f) => f.startsWith(path) && suffixPattern.test(f));
    return `/${url}`;
}
exports.findScriptUrl = findScriptUrl;
