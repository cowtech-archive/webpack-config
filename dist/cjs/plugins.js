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
exports.setupPlugins = exports.resolveFile = exports.serviceWorkerDefaultExclude = exports.serviceWorkerDefaultInclude = void 0;
const crypto_1 = require("crypto");
const fork_ts_checker_webpack_plugin_1 = __importDefault(require("fork-ts-checker-webpack-plugin"));
const globby_1 = __importDefault(require("globby"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const path_1 = require("path");
// @ts-expect-error
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin"));
const webpack_1 = require("webpack");
// @ts-expect-error
const webpack_bundle_analyzer_1 = require("webpack-bundle-analyzer");
// @ts-expect-error
const workbox_webpack_plugin_1 = require("workbox-webpack-plugin");
const environment_1 = require("./environment");
const rules_1 = require("./rules");
__exportStar(require("./babel-remove-function"), exports);
exports.serviceWorkerDefaultInclude = [
    /\.(?:html|js|json|mjs|css)$/,
    /images.+\.(?:bmp|jpg|jpeg|png|svg|webp)$/
];
exports.serviceWorkerDefaultExclude = [
    /\.map$/,
    /bundle(?:-.+)?\.(?:mjs|js)$/,
    /404\.html/
];
class ServiceWorkerEnvironment {
    constructor({ dest, version, debug }) {
        this.dest = dest;
        this.version = version;
        this.debug = debug;
    }
    apply(compiler) {
        const dest = this.dest;
        compiler.hooks.emit.tap('ServiceWorkerEnvironment', (current) => {
            const content = `self.__version = '${this.version}'; self.__debug = ${this.debug};`;
            current.assets[dest] = {
                source() {
                    return content;
                },
                size() {
                    return content.length;
                }
            };
        });
        compiler.hooks.compilation.tap('ServiceWorkerEnvironment', (current) => {
            current.cache['service-worker-environment'] = dest;
        });
    }
}
class HtmlWebpackTrackerPlugin {
    constructor() {
        this.files = new Map();
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('HtmlWebpackTrackerPlugin', (current) => {
            const plugin = html_webpack_plugin_1.default;
            plugin
                .getHooks(current)
                .afterEmit.tap('HtmlWebpackTrackerPlugin', ({ outputName, plugin }) => {
                current.cache[`html-webpack-tracker-plugin:${plugin.options.id}`] = outputName;
            });
        });
    }
}
async function resolveFile(options, key, pattern) {
    var _a;
    let file = (_a = options[key]) !== null && _a !== void 0 ? _a : true;
    if (file === true) {
        file = (await globby_1.default(path_1.resolve(options.srcFolder, pattern)))[0];
    }
    return typeof file === 'string' ? file : null;
}
exports.resolveFile = resolveFile;
async function setupPlugins(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const pluginsOptions = (_a = options.plugins) !== null && _a !== void 0 ? _a : {};
    const swOptions = (_b = options.serviceWorker) !== null && _b !== void 0 ? _b : {};
    const rules = (_c = options.rules) !== null && _c !== void 0 ? _c : {};
    const useTypescript = await rules_1.checkTypescript(rules, options.srcFolder);
    const analyze = (_d = pluginsOptions.analyze) !== null && _d !== void 0 ? _d : true;
    const hmr = (_f = (_e = options.server) === null || _e === void 0 ? void 0 : _e.hot) !== null && _f !== void 0 ? _f : true;
    const indexFile = await resolveFile(options, 'index', './index.html.(js|ts|jsx|tsx)');
    const error404 = await resolveFile(options, 'error404', './404.html.(js|ts|jsx|tsx)');
    const manifest = (await globby_1.default(path_1.resolve(options.srcFolder, './manifest.json.(js|ts)')))[0];
    const robots = (await globby_1.default(path_1.resolve(options.srcFolder, './robots.txt.(js|ts)')))[0];
    let plugins = [
        new webpack_1.EnvironmentPlugin({
            NODE_ENV: options.environment
        }),
        new webpack_1.DefinePlugin({
            ENV: JSON.stringify(options.env),
            VERSION: JSON.stringify(options.version),
            ICONS: JSON.stringify(options.icons)
        }),
        new HtmlWebpackTrackerPlugin()
    ];
    if (manifest && ((_g = rules.manifest) !== null && _g !== void 0 ? _g : true)) {
        plugins.push(new html_webpack_plugin_1.default({
            id: 'manifest',
            filename: 'manifest-[contenthash].json',
            template: manifest,
            minify: true,
            inject: false
        }));
    }
    if (robots && ((_h = rules.robots) !== null && _h !== void 0 ? _h : true)) {
        plugins.push(new html_webpack_plugin_1.default({
            id: 'robots',
            filename: 'robots.txt',
            template: robots,
            minify: false,
            inject: false
        }));
    }
    if (useTypescript) {
        plugins.push(new fork_ts_checker_webpack_plugin_1.default({
            async: false,
            typescript: {
                enabled: true
            }
        }));
    }
    if (indexFile) {
        plugins.push(new html_webpack_plugin_1.default({
            template: indexFile,
            minify: { collapseWhitespace: true },
            inject: false
        }));
    }
    if (error404) {
        plugins.push(new html_webpack_plugin_1.default({
            template: error404,
            filename: '404.html',
            minify: { collapseWhitespace: true },
            inject: false
        }));
    }
    if (options.environment === 'production') {
        if ((_j = pluginsOptions.minify) !== null && _j !== void 0 ? _j : true) {
            plugins.push(new terser_webpack_plugin_1.default((_k = options.uglify) !== null && _k !== void 0 ? _k : {}));
        }
    }
    else if (hmr) {
        plugins.push(new webpack_1.HotModuleReplacementPlugin());
    }
    if (analyze) {
        if (path_1.basename(process.argv[1]) !== 'webpack') {
            plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
                analyzerMode: typeof analyze === 'string' ? analyze : 'server',
                analyzerHost: (_m = (_l = options.server) === null || _l === void 0 ? void 0 : _l.host) !== null && _m !== void 0 ? _m : 'home.cowtech.it',
                analyzerPort: ((_p = (_o = options.server) === null || _o === void 0 ? void 0 : _o.port) !== null && _p !== void 0 ? _p : 4200) + 2,
                generateStatsFile: analyze === 'static',
                openAnalyzer: false
            }));
        }
        else {
            plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
                analyzerMode: 'static',
                generateStatsFile: true,
                openAnalyzer: false
            }));
        }
    }
    if (swOptions.enabled === true || options.environment === 'production') {
        const swSrc = await resolveFile(options, 'serviceWorker.src', './(service-worker|sw).(js|ts)');
        if (swSrc) {
            // Create the hash for the filename
            const hashFactory = crypto_1.createHash('md4');
            hashFactory.update(JSON.stringify({ version: options.version }));
            const hash = hashFactory.digest('hex');
            const swDest = (_q = swOptions.dest) !== null && _q !== void 0 ? _q : 'sw.js';
            const envFile = swDest.replace(/\.js$/, `-env-${hash}.js`);
            exports.serviceWorkerDefaultExclude.push(envFile);
            plugins.push(new ServiceWorkerEnvironment({
                dest: envFile,
                version: options.version,
                debug: (_r = swOptions.debug) !== null && _r !== void 0 ? _r : options.environment !== 'production'
            }), new workbox_webpack_plugin_1.InjectManifest({
                swSrc,
                swDest,
                include: exports.serviceWorkerDefaultInclude,
                exclude: exports.serviceWorkerDefaultExclude,
                importScripts: [`/${envFile}`],
                ...((_s = swOptions.options) !== null && _s !== void 0 ? _s : {})
            }));
        }
    }
    if (pluginsOptions.additional) {
        plugins = plugins.concat(pluginsOptions.additional);
    }
    return environment_1.runHook(plugins, pluginsOptions.afterHook);
}
exports.setupPlugins = setupPlugins;
