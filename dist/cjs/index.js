"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = exports.generateVersion = void 0;
const path_1 = require("path");
const entries_1 = require("./entries");
const environment_1 = require("./environment");
const icons_1 = require("./icons");
const plugins_1 = require("./plugins");
const rules_1 = require("./rules");
const server_1 = require("./server");
__exportStar(require("./entries"), exports);
__exportStar(require("./environment"), exports);
__exportStar(require("./icons"), exports);
__exportStar(require("./plugins"), exports);
__exportStar(require("./rules"), exports);
__exportStar(require("./server"), exports);
__exportStar(require("./types"), exports);
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
    options.srcFolder = path_1.resolve(process.cwd(), (_a = options.srcFolder) !== null && _a !== void 0 ? _a : 'src');
    options.destFolder = path_1.resolve(process.cwd(), (_b = options.destFolder) !== null && _b !== void 0 ? _b : 'dist');
    options.env = environment_1.setupEnvironment(options);
    options.icons = await icons_1.loadIcons(options);
    const server = await server_1.setupServer(options);
    const stats = ((_c = options.stats) !== null && _c !== void 0 ? _c : options.environment === 'production') ? 'normal' : 'errors-only';
    server.stats = stats;
    const mainExtension = ((_d = options.useESModules) !== null && _d !== void 0 ? _d : true) ? 'mjs' : 'js';
    const config = {
        mode: options.environment === 'production' ? 'production' : 'development',
        entry: (_e = options.entries) !== null && _e !== void 0 ? _e : (await entries_1.autoDetectEntries(options)),
        output: {
            filename: `[name]-[contenthash].${mainExtension}`,
            chunkFilename: `[name]-[contenthash].${mainExtension}`,
            path: options.destFolder,
            publicPath: (_f = options.publicPath) !== null && _f !== void 0 ? _f : '/',
            libraryTarget: options.libraryTarget
        },
        target: options.target,
        module: {
            rules: await rules_1.setupRules(options)
        },
        resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
        plugins: await plugins_1.setupPlugins(options),
        externals: options.externals,
        devtool: options.environment === 'development' ? (_g = options.sourceMaps) !== null && _g !== void 0 ? _g : 'source-map' : false,
        cache: true,
        devServer: server,
        performance: (_h = options.performance) !== null && _h !== void 0 ? _h : { hints: false },
        stats,
        optimization: {
            splitChunks: (_k = (_j = options.plugins) === null || _j === void 0 ? void 0 : _j.splitChunks) !== null && _k !== void 0 ? _k : { chunks: 'all' },
            concatenateModules: (_m = (_l = options.plugins) === null || _l === void 0 ? void 0 : _l.concatenate) !== null && _m !== void 0 ? _m : true
        }
    };
    return environment_1.runHook(config, options.afterHook);
}
exports.setup = setup;
