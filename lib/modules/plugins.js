"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const crypto_1 = require("crypto");
const fork_ts_checker_webpack_plugin_1 = __importDefault(require("fork-ts-checker-webpack-plugin"));
const globby_1 = __importDefault(require("globby"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const path_1 = require("path");
// @ts-ignore
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin"));
const webpack_1 = require("webpack");
// @ts-ignore
const webpack_bundle_analyzer_1 = require("webpack-bundle-analyzer");
// @ts-ignore
const workbox_webpack_plugin_1 = require("workbox-webpack-plugin");
const environment_1 = require("./environment");
const rules_1 = require("./rules");
__export(require("./plugins/babel-remove-function"));
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
        compiler.hooks.emit.tap('ServiceWorkerEnvironment', (current) => {
            const content = `self.__version = '${this.version}'; self.__debug = ${this.debug};`;
            current.assets[this.dest] = {
                source() {
                    return content;
                },
                size() {
                    return content.length;
                }
            };
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
    let file = (_a = options[key], (_a !== null && _a !== void 0 ? _a : true));
    if (file === true) {
        file = (await globby_1.default(path_1.resolve(options.srcFolder, pattern)))[0];
    }
    return typeof file === 'string' ? file : null;
}
exports.resolveFile = resolveFile;
async function setupPlugins(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const pluginsOptions = (_a = options.plugins, (_a !== null && _a !== void 0 ? _a : {}));
    const swOptions = (_b = options.serviceWorker, (_b !== null && _b !== void 0 ? _b : {}));
    const rules = (_c = options.rules, (_c !== null && _c !== void 0 ? _c : {}));
    const useTypescript = await rules_1.checkTypescript(rules, options.srcFolder);
    const analyze = (_d = pluginsOptions.analyze, (_d !== null && _d !== void 0 ? _d : true));
    const hmr = (_f = (_e = options.server) === null || _e === void 0 ? void 0 : _e.hot, (_f !== null && _f !== void 0 ? _f : true));
    const indexFile = await resolveFile(options, 'index', './index.html.(js|ts|jsx|tsx)');
    const error404 = await resolveFile(options, 'error404', './404.html.(js|ts|jsx|tsx)');
    const manifest = (await globby_1.default(path_1.resolve(options.srcFolder, './manifest.json.{js|ts}')))[0];
    const robots = (await globby_1.default(path_1.resolve(options.srcFolder, './robots.txt.{js|ts}')))[0];
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
    if (manifest && (_g = rules.manifest, (_g !== null && _g !== void 0 ? _g : true))) {
        plugins.push(new html_webpack_plugin_1.default({
            id: 'manifest',
            filename: 'manifest-[contenthash].json',
            template: manifest,
            minify: true,
            inject: false
        }));
    }
    if (robots && (_h = rules.robots, (_h !== null && _h !== void 0 ? _h : true))) {
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
            checkSyntacticErrors: true,
            async: false,
            useTypescriptIncrementalApi: true
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
        if (_j = pluginsOptions.minify, (_j !== null && _j !== void 0 ? _j : true)) {
            plugins.push(new terser_webpack_plugin_1.default((_k = options.uglify, (_k !== null && _k !== void 0 ? _k : {}))));
        }
    }
    else if (hmr) {
        plugins.push(new webpack_1.HotModuleReplacementPlugin());
    }
    if (analyze) {
        if (path_1.basename(process.argv[1]) !== 'webpack') {
            plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
                analyzerMode: typeof analyze === 'string' ? analyze : 'server',
                analyzerHost: (_m = (_l = options.server) === null || _l === void 0 ? void 0 : _l.host, (_m !== null && _m !== void 0 ? _m : 'home.cowtech.it')),
                analyzerPort: (_p = (_o = options.server) === null || _o === void 0 ? void 0 : _o.port, (_p !== null && _p !== void 0 ? _p : 4200)) + 2,
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
    if ((_q = swOptions.enabled, (_q !== null && _q !== void 0 ? _q : options.environment)) === 'production') {
        let swSrc = await resolveFile(options, 'serviceWorker.src', './(service-worker|sw).(js|ts)');
        if (swSrc) {
            // Create the hash for the filename
            const hashFactory = crypto_1.createHash('md4');
            hashFactory.update(JSON.stringify({ version: options.version }));
            const hash = hashFactory.digest('hex');
            const swDest = (_r = swOptions.dest, (_r !== null && _r !== void 0 ? _r : 'sw.js'));
            const envFile = swDest.replace(/\.js$/, `-env-${hash}.js`);
            exports.serviceWorkerDefaultExclude.push(envFile);
            plugins.push(new ServiceWorkerEnvironment({
                dest: envFile,
                version: options.version,
                debug: (_s = swOptions.debug, (_s !== null && _s !== void 0 ? _s : options.environment !== 'production'))
            }), new workbox_webpack_plugin_1.InjectManifest(Object.assign({ swSrc,
                swDest, include: exports.serviceWorkerDefaultInclude, exclude: exports.serviceWorkerDefaultExclude, importScripts: [`/${envFile}`] }, (_t = swOptions.options, (_t !== null && _t !== void 0 ? _t : {})))));
        }
    }
    if (pluginsOptions.additional) {
        plugins = plugins.concat(pluginsOptions.additional);
    }
    return environment_1.runHook(plugins, pluginsOptions.afterHook);
}
exports.setupPlugins = setupPlugins;
