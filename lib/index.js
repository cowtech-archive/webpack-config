"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const entries_1 = require("./modules/entries");
const environment_1 = require("./modules/environment");
const icons_1 = require("./modules/icons");
const plugins_1 = require("./modules/plugins");
const rules_1 = require("./modules/rules");
const server_1 = require("./modules/server");
__export(require("./modules/entries"));
__export(require("./modules/environment"));
__export(require("./modules/icons"));
__export(require("./modules/plugins"));
__export(require("./modules/rules"));
__export(require("./modules/server"));
function generateVersion() {
    return new Date()
        .toISOString()
        .replace(/([-:])|(\.\d+Z$)/g, '')
        .replace('T', '.');
}
exports.generateVersion = generateVersion;
async function setup(options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (!options.environment || typeof options.environment !== 'string') {
        options.environment = 'development';
    }
    if (!options.version) {
        options.version = generateVersion();
    }
    options.srcFolder = path_1.resolve(process.cwd(), (_a = options.srcFolder, (_a !== null && _a !== void 0 ? _a : 'src')));
    options.destFolder = path_1.resolve(process.cwd(), (_b = options.destFolder, (_b !== null && _b !== void 0 ? _b : 'dist')));
    options.env = environment_1.setupEnvironment(options);
    options.icons = await icons_1.loadIcons(options);
    const server = await server_1.setupServer(options);
    const stats = (_c = options.stats, (_c !== null && _c !== void 0 ? _c : options.environment === 'production')) ? 'normal' : 'errors-only';
    server.stats = stats;
    const mainExtension = (_d = options.useESModules, (_d !== null && _d !== void 0 ? _d : true)) ? 'mjs' : 'js';
    const config = {
        mode: options.environment === 'production' ? 'production' : 'development',
        entry: (_e = options.entries, (_e !== null && _e !== void 0 ? _e : (await entries_1.autoDetectEntries(options)))),
        output: {
            filename: `[name]-[hash].${mainExtension}`,
            chunkFilename: `[name]-[hash].${mainExtension}`,
            path: options.destFolder,
            publicPath: (_f = options.publicPath, (_f !== null && _f !== void 0 ? _f : '/')),
            libraryTarget: options.libraryTarget
        },
        target: options.target,
        module: {
            rules: await rules_1.setupRules(options)
        },
        resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
        plugins: await plugins_1.setupPlugins(options),
        externals: options.externals,
        devtool: options.environment === 'development' ? (_g = options.sourceMaps, (_g !== null && _g !== void 0 ? _g : 'source-map')) : false,
        cache: true,
        devServer: server,
        performance: (_h = options.performance, (_h !== null && _h !== void 0 ? _h : { hints: false })),
        stats,
        optimization: {
            splitChunks: (_k = (_j = options.plugins) === null || _j === void 0 ? void 0 : _j.splitChunks, (_k !== null && _k !== void 0 ? _k : false)),
            concatenateModules: (_m = (_l = options.plugins) === null || _l === void 0 ? void 0 : _l.concatenate, (_m !== null && _m !== void 0 ? _m : true))
        }
    };
    return environment_1.runHook(config, options.afterHook);
}
exports.setup = setup;
