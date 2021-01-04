import { resolve } from 'path';
import { autoDetectEntries } from "./entries.mjs";
import { runHook, setupEnvironment } from "./environment.mjs";
import { loadIcons } from "./icons.mjs";
import { setupPlugins } from "./plugins.mjs";
import { setupRules } from "./rules.mjs";
import { setupServer } from "./server.mjs";
export * from "./entries.mjs";
export * from "./environment.mjs";
export * from "./icons.mjs";
export * from "./plugins.mjs";
export * from "./rules.mjs";
export * from "./server.mjs";
export * from "./types.mjs";
export function generateVersion() {
    return new Date()
        .toISOString()
        .replace(/([-:])|(\.\d+Z$)/g, '')
        .replace('T', '.');
}
export async function setup(options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (!options.environment || typeof options.environment !== 'string') {
        options.environment = 'development';
    }
    if (!options.version) {
        options.version = generateVersion();
    }
    options.srcFolder = resolve(process.cwd(), (_a = options.srcFolder) !== null && _a !== void 0 ? _a : 'src');
    options.destFolder = resolve(process.cwd(), (_b = options.destFolder) !== null && _b !== void 0 ? _b : 'dist');
    options.env = setupEnvironment(options);
    options.icons = await loadIcons(options);
    const server = await setupServer(options);
    const stats = ((_c = options.stats) !== null && _c !== void 0 ? _c : options.environment === 'production') ? 'normal' : 'errors-only';
    server.stats = stats;
    const mainExtension = ((_d = options.useESModules) !== null && _d !== void 0 ? _d : true) ? 'mjs' : 'js';
    const config = {
        mode: options.environment === 'production' ? 'production' : 'development',
        entry: (_e = options.entries) !== null && _e !== void 0 ? _e : (await autoDetectEntries(options)),
        output: {
            filename: `[name]-[hash].${mainExtension}`,
            chunkFilename: `[name]-[hash].${mainExtension}`,
            path: options.destFolder,
            publicPath: (_f = options.publicPath) !== null && _f !== void 0 ? _f : '/',
            libraryTarget: options.libraryTarget
        },
        target: options.target,
        module: {
            rules: await setupRules(options)
        },
        resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
        plugins: await setupPlugins(options),
        externals: options.externals,
        devtool: options.environment === 'development' ? (_g = options.sourceMaps) !== null && _g !== void 0 ? _g : 'source-map' : false,
        cache: true,
        devServer: server,
        performance: (_h = options.performance) !== null && _h !== void 0 ? _h : { hints: false },
        stats,
        optimization: {
            splitChunks: (_k = (_j = options.plugins) === null || _j === void 0 ? void 0 : _j.splitChunks) !== null && _k !== void 0 ? _k : false,
            concatenateModules: (_m = (_l = options.plugins) === null || _l === void 0 ? void 0 : _l.concatenate) !== null && _m !== void 0 ? _m : true
        }
    };
    return runHook(config, options.afterHook);
}
