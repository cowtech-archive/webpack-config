import { resolve } from 'path';
import { autoDetectEntries } from "./entries.mjs";
import { runHook, setupEnvironment } from "./environment.mjs";
import { loadIcons } from "./icons.mjs";
import { setupPlugins } from "./plugins.mjs";
import { normalizeAssetPath, setupRules } from "./rules.mjs";
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
export function normalizeWebpackEnvironment(env) {
    return env.production === true ? 'production' : 'development';
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
    const mainExtension = ((_c = options.useESModules) !== null && _c !== void 0 ? _c : true) ? 'mjs' : 'js';
    const config = {
        mode: options.environment === 'production' ? 'production' : 'development',
        entry: (_d = options.entries) !== null && _d !== void 0 ? _d : (await autoDetectEntries(options)),
        output: {
            filename: `[name]-[contenthash].${mainExtension}`,
            chunkFilename: `[name]-[contenthash].${mainExtension}`,
            path: options.destFolder,
            publicPath: (_e = options.publicPath) !== null && _e !== void 0 ? _e : '/',
            libraryTarget: options.libraryTarget,
            assetModuleFilename: normalizeAssetPath
        },
        target: options.target,
        module: {
            rules: await setupRules(options)
        },
        resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
        plugins: await setupPlugins(options),
        externals: options.externals,
        devtool: options.environment === 'development' ? (_f = options.sourceMaps) !== null && _f !== void 0 ? _f : 'source-map' : false,
        cache: true,
        devServer: server,
        performance: (_g = options.performance) !== null && _g !== void 0 ? _g : { hints: false },
        stats: ((_h = options.stats) !== null && _h !== void 0 ? _h : options.environment === 'production') ? 'normal' : 'errors-only',
        optimization: {
            splitChunks: (_k = (_j = options.plugins) === null || _j === void 0 ? void 0 : _j.splitChunks) !== null && _k !== void 0 ? _k : { chunks: 'all' },
            concatenateModules: (_m = (_l = options.plugins) === null || _l === void 0 ? void 0 : _l.concatenate) !== null && _m !== void 0 ? _m : true
        }
    };
    return runHook(config, options.afterHook);
}
