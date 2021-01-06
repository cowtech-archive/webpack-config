export const scriptUrlSuffix = /-(?:(?:[a-f0-9]+)\.mjs)$/i;
export function generateVersion() {
    return new Date()
        .toISOString()
        .replace(/([-:])|(\.\d+Z$)/g, '')
        .replace('T', '.');
}
export function normalizeWebpackEnvironment(env) {
    return env.production === true ? 'production' : 'development';
}
export function findScriptUrl(compilation, path, suffixPattern) {
    var _a;
    if (!suffixPattern) {
        suffixPattern = scriptUrlSuffix;
    }
    const files = (_a = compilation.entrypoints.get(path)) === null || _a === void 0 ? void 0 : _a.getFiles();
    if (!files) {
        return undefined;
    }
    const url = files.find((f) => f.startsWith(path) && suffixPattern.test(f));
    return `/${url}`;
}
