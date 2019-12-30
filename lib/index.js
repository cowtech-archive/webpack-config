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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!options.environment || typeof options.environment !== 'string') {
        options.environment = 'development';
    }
    if (!options.version) {
        options.version = generateVersion();
    }
    options.srcFolder = path_1.resolve(process.cwd(), options.srcFolder);
    options.destFolder = path_1.resolve(process.cwd(), options.destFolder);
    options.env = environment_1.setupEnvironment(options);
    options.icons = await icons_1.loadIcons(options);
    const server = await server_1.setupServer(options);
    const stats = (_a = options.stats, (_a !== null && _a !== void 0 ? _a : options.environment === 'production')) ? 'normal' : 'errors-only';
    server.stats = stats;
    const mainExtension = (_b = options.useESModules, (_b !== null && _b !== void 0 ? _b : true)) ? 'mjs' : 'js';
    let config = {
        mode: options.environment === 'production' ? 'production' : 'development',
        entry: options.entries || (await entries_1.autoDetectEntries(options)),
        output: {
            filename: `[name]-[hash].${mainExtension}`,
            chunkFilename: `[name]-[hash].${mainExtension}`,
            path: options.destFolder,
            publicPath: (_c = options.publicPath, (_c !== null && _c !== void 0 ? _c : '/')),
            libraryTarget: options.libraryTarget
        },
        target: options.target,
        module: {
            rules: await rules_1.setupRules(options)
        },
        resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
        plugins: await plugins_1.setupPlugins(options),
        externals: options.externals,
        devtool: options.environment === 'development' ? (_d = options.sourceMaps, (_d !== null && _d !== void 0 ? _d : 'source-map')) : false,
        cache: true,
        devServer: server,
        performance: (_e = options.performance, (_e !== null && _e !== void 0 ? _e : { hints: false })),
        stats,
        optimization: {
            splitChunks: (_g = (_f = options.plugins) === null || _f === void 0 ? void 0 : _f.splitChunks, (_g !== null && _g !== void 0 ? _g : false)),
            concatenateModules: (_j = (_h = options.plugins) === null || _h === void 0 ? void 0 : _h.concatenate, (_j !== null && _j !== void 0 ? _j : true))
        }
    };
    return environment_1.runHook(config, options.afterHook);
}
exports.setup = setup;
