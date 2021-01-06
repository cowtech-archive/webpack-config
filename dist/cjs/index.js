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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = void 0;
const webpack_utils_1 = require("@cowtech/webpack-utils");
const path_1 = require("path");
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin"));
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
async function setup(options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (!options.environment || typeof options.environment !== 'string') {
        options.environment = 'development';
    }
    if (!options.version) {
        options.version = webpack_utils_1.generateVersion();
    }
    options.srcFolder = path_1.resolve(process.cwd(), (_a = options.srcFolder) !== null && _a !== void 0 ? _a : 'src');
    options.destFolder = path_1.resolve(process.cwd(), (_b = options.destFolder) !== null && _b !== void 0 ? _b : 'dist');
    options.env = environment_1.setupEnvironment(options);
    options.icons = await icons_1.loadIcons(options);
    const server = await server_1.setupServer(options);
    const mainExtension = ((_c = options.useESModules) !== null && _c !== void 0 ? _c : true) ? 'mjs' : 'js';
    const minimizer = [];
    if (options.environment === 'production' && ((_e = (_d = options.plugins) === null || _d === void 0 ? void 0 : _d.minify) !== null && _e !== void 0 ? _e : true)) {
        minimizer.push(new terser_webpack_plugin_1.default((_f = options.uglify) !== null && _f !== void 0 ? _f : {}));
    }
    const config = {
        mode: options.environment === 'production' ? 'production' : 'development',
        entry: (_g = options.entries) !== null && _g !== void 0 ? _g : (await entries_1.autoDetectEntries(options)),
        output: {
            filename: `[name]-[contenthash].${mainExtension}`,
            chunkFilename: `[name]-[contenthash].${mainExtension}`,
            path: options.destFolder,
            publicPath: (_h = options.publicPath) !== null && _h !== void 0 ? _h : '/',
            libraryTarget: options.libraryTarget,
            assetModuleFilename: webpack_utils_1.normalizeAssetPath
        },
        target: options.target,
        module: {
            rules: await rules_1.setupRules(options)
        },
        resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
        plugins: await plugins_1.setupPlugins(options),
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
    return environment_1.runHook(config, options.afterHook);
}
exports.setup = setup;
