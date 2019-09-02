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
const lodash_get_1 = __importDefault(require("lodash.get"));
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
    /\.(html|js|json|mjs|css)$/,
    /images.+\.(bmp|jpg|jpeg|png|svg|webp)$/
];
exports.serviceWorkerDefaultExclude = [
    /\.map$/,
    /manifest\.json/,
    /bundle\.js/,
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
    let file = lodash_get_1.default(options, key, true);
    if (file === true) {
        file = (await globby_1.default(path_1.resolve(options.srcFolder, pattern)))[0];
    }
    return typeof file === 'string' ? file : null;
}
exports.resolveFile = resolveFile;
async function setupPlugins(options) {
    const pluginsOptions = options.plugins || {};
    const swOptions = options.serviceWorker || {};
    const useTypescript = await rules_1.checkTypescript(options.rules || {}, options.srcFolder);
    const analyze = lodash_get_1.default(pluginsOptions, 'analyze', true);
    const hmr = lodash_get_1.default(options, 'server.hot', true);
    const indexFile = await resolveFile(options, 'index', './index.html.(js|ts|jsx|tsx)');
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
    if (manifest && lodash_get_1.default(options.rules, 'manifest', true)) {
        plugins.push(new html_webpack_plugin_1.default({
            id: 'manifest',
            filename: 'manifest-[contenthash].json',
            template: manifest,
            minify: true,
            inject: false
        }));
    }
    if (robots && lodash_get_1.default(options.rules, 'robots', true)) {
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
    if (options.environment === 'production') {
        if (lodash_get_1.default(pluginsOptions, 'minify', true)) {
            plugins.push(new terser_webpack_plugin_1.default(lodash_get_1.default(options, 'uglify', {})));
        }
    }
    else if (hmr) {
        plugins.push(new webpack_1.HotModuleReplacementPlugin());
    }
    if (analyze) {
        if (path_1.basename(process.argv[1]) !== 'webpack') {
            plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
                analyzerMode: typeof analyze === 'string' ? analyze : 'server',
                analyzerHost: lodash_get_1.default(options, 'server.host', 'home.cowtech.it'),
                analyzerPort: lodash_get_1.default(options, 'server.port', 4200) + 2,
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
    if (lodash_get_1.default(swOptions, 'enabled', options.environment === 'production')) {
        let swSrc = await resolveFile(options, 'serviceWorker.src', './(service-worker|sw).(js|ts)');
        if (swSrc) {
            // Create the hash for the filename
            const hashFactory = crypto_1.createHash('md4');
            hashFactory.update(JSON.stringify({ version: options.version }));
            const hash = hashFactory.digest('hex');
            const swDest = lodash_get_1.default(swOptions, 'dest', 'sw.js');
            const envFile = swDest.replace(/\.js$/, `-env-${hash}.js`);
            exports.serviceWorkerDefaultExclude.push(envFile);
            plugins.push(new ServiceWorkerEnvironment({
                dest: envFile,
                version: options.version,
                debug: options.environment !== 'production'
            }), new workbox_webpack_plugin_1.InjectManifest(Object.assign({ swSrc,
                swDest, include: exports.serviceWorkerDefaultInclude, exclude: exports.serviceWorkerDefaultExclude, importScripts: [`/${envFile}`] }, lodash_get_1.default(swOptions, 'options', {}))));
        }
    }
    if (pluginsOptions.additional) {
        plugins = plugins.concat(pluginsOptions.additional);
    }
    return environment_1.runHook(plugins, pluginsOptions.afterHook);
}
exports.setupPlugins = setupPlugins;
