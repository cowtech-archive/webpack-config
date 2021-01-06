import { generateVersion, normalizeAssetPath } from '@cowtech/webpack-utils';
import { resolve } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
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
export async function setup(options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
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
    const minimizer = [];
    if (options.environment === 'production' && ((_e = (_d = options.plugins) === null || _d === void 0 ? void 0 : _d.minify) !== null && _e !== void 0 ? _e : true)) {
        minimizer.push(new TerserPlugin((_f = options.uglify) !== null && _f !== void 0 ? _f : {}));
    }
    const config = {
        mode: options.environment === 'production' ? 'production' : 'development',
        entry: (_g = options.entries) !== null && _g !== void 0 ? _g : (await autoDetectEntries(options)),
        output: {
            filename: `[name]-[contenthash].${mainExtension}`,
            chunkFilename: `[name]-[contenthash].${mainExtension}`,
            path: options.destFolder,
            publicPath: (_h = options.publicPath) !== null && _h !== void 0 ? _h : '/',
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
        devtool: options.environment === 'development' ? (_j = options.sourceMaps) !== null && _j !== void 0 ? _j : 'source-map' : false,
        cache: true,
        devServer: server,
        performance: (_k = options.performance) !== null && _k !== void 0 ? _k : { hints: false },
        stats: ((_l = options.stats) !== null && _l !== void 0 ? _l : options.environment === 'production') ? 'normal' : 'errors-only',
        optimization: {
            splitChunks: (_o = (_m = options.plugins) === null || _m === void 0 ? void 0 : _m.splitChunks) !== null && _o !== void 0 ? _o : false,
            concatenateModules: (_q = (_p = options.plugins) === null || _p === void 0 ? void 0 : _p.concatenate) !== null && _q !== void 0 ? _q : true,
            minimize: true,
            minimizer
        }
    };
    return runHook(config, options.afterHook);
}
