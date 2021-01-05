import { createHash } from 'crypto';
import globby from 'globby';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { basename, resolve } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { Compilation, DefinePlugin, EnvironmentPlugin, HotModuleReplacementPlugin, sources } from 'webpack';
// @ts-expect-error - Even if @types/webpack-bundle-analyzer, it generates a conflict with Webpack 5. Revisit in the future.
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { InjectManifest } from 'workbox-webpack-plugin';
import { runHook } from "./environment.mjs";
export * from "./babel-remove-function.mjs";
export const serviceWorkerDefaultInclude = [
    /\.(?:html|js|json|mjs|css)$/,
    /images.+\.(?:bmp|jpg|jpeg|png|svg|webp)$/
];
export const serviceWorkerDefaultExclude = [
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
        compiler.hooks.compilation.tap('ServiceWorkerEnvironment', (current) => {
            const content = `self.__version = '${this.version}'; self.__debug = ${this.debug};`;
            current.hooks.processAssets.tap({
                name: 'ServiceWorkerEnvironment',
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, () => {
                current.emitAsset(dest, new sources.RawSource(content));
            });
            compiler.hooks.emit.tapPromise('ServiceWorkerEnvironment', (current) => {
                return current.getCache('cowtech').storePromise('service-worker-environment', null, dest);
            });
        });
    }
}
class HtmlWebpackTrackerPlugin {
    constructor() {
        this.files = new Map();
    }
    apply(compiler) {
        compiler.hooks.emit.tap('HtmlWebpackTrackerPlugin', (current) => {
            const plugin = HtmlWebpackPlugin;
            plugin
                .getHooks(current)
                .afterEmit.tapPromise('HtmlWebpackTrackerPlugin', ({ outputName, plugin }) => {
                return current
                    .getCache('cowtech')
                    .storePromise(`html-webpack-tracker-plugin:${plugin.options.id}`, null, outputName);
            });
        });
    }
}
export async function resolveFile(options, key, pattern) {
    var _a;
    let file = (_a = options[key]) !== null && _a !== void 0 ? _a : true;
    if (file === true) {
        file = (await globby(resolve(options.srcFolder, pattern)))[0];
    }
    return typeof file === 'string' ? file : null;
}
export async function setupPlugins(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const pluginsOptions = (_a = options.plugins) !== null && _a !== void 0 ? _a : {};
    const swOptions = (_b = options.serviceWorker) !== null && _b !== void 0 ? _b : {};
    const rules = (_c = options.rules) !== null && _c !== void 0 ? _c : {};
    const analyze = (_d = pluginsOptions.analyze) !== null && _d !== void 0 ? _d : true;
    const hmr = (_f = (_e = options.server) === null || _e === void 0 ? void 0 : _e.hot) !== null && _f !== void 0 ? _f : true;
    const indexFile = await resolveFile(options, 'index', './index.html.(js|ts|jsx|tsx)');
    const error404 = await resolveFile(options, 'error404', './404.html.(js|ts|jsx|tsx)');
    const manifest = (await globby(resolve(options.srcFolder, './manifest.json.(js|ts)')))[0];
    const robots = (await globby(resolve(options.srcFolder, './robots.txt.(js|ts)')))[0];
    let plugins = [
        new EnvironmentPlugin({
            NODE_ENV: options.environment
        }),
        new DefinePlugin({
            ENV: JSON.stringify(options.env),
            VERSION: JSON.stringify(options.version),
            ICONS: JSON.stringify(options.icons)
        }),
        new HtmlWebpackTrackerPlugin()
    ];
    if (manifest && ((_g = rules.manifest) !== null && _g !== void 0 ? _g : true)) {
        plugins.push(new HtmlWebpackPlugin({
            id: 'manifest',
            filename: 'manifest-[contenthash].json',
            template: manifest,
            minify: true,
            inject: false
        }));
    }
    if (robots && ((_h = rules.robots) !== null && _h !== void 0 ? _h : true)) {
        plugins.push(new HtmlWebpackPlugin({
            id: 'robots',
            filename: 'robots.txt',
            template: robots,
            minify: false,
            inject: false
        }));
    }
    if (indexFile) {
        plugins.push(new HtmlWebpackPlugin({
            template: indexFile,
            minify: { collapseWhitespace: true },
            inject: false
        }));
    }
    if (error404) {
        plugins.push(new HtmlWebpackPlugin({
            template: error404,
            filename: '404.html',
            minify: { collapseWhitespace: true },
            inject: false
        }));
    }
    if (options.environment === 'production') {
        if ((_j = pluginsOptions.minify) !== null && _j !== void 0 ? _j : true) {
            plugins.push(new TerserPlugin((_k = options.uglify) !== null && _k !== void 0 ? _k : {}));
        }
    }
    else if (hmr) {
        plugins.push(new HotModuleReplacementPlugin());
    }
    if (analyze) {
        if (basename(process.argv[1]) !== 'webpack') {
            const analyzerMode = typeof analyze === 'string' ? analyze : 'server';
            plugins.push(new BundleAnalyzerPlugin({
                analyzerMode: analyzerMode,
                analyzerHost: (_m = (_l = options.server) === null || _l === void 0 ? void 0 : _l.host) !== null && _m !== void 0 ? _m : 'home.cowtech.it',
                analyzerPort: ((_p = (_o = options.server) === null || _o === void 0 ? void 0 : _o.port) !== null && _p !== void 0 ? _p : 4200) + 2,
                generateStatsFile: analyze === 'static',
                openAnalyzer: false
            }));
        }
        else {
            plugins.push(new BundleAnalyzerPlugin({
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
            const hashFactory = createHash('md4');
            hashFactory.update(JSON.stringify({ version: options.version }));
            const hash = hashFactory.digest('hex');
            const swDest = (_q = swOptions.dest) !== null && _q !== void 0 ? _q : 'sw.js';
            const envFile = swDest.replace(/\.js$/, `-env-${hash}.js`);
            serviceWorkerDefaultExclude.push(envFile);
            plugins.push(new ServiceWorkerEnvironment({
                dest: envFile,
                version: options.version,
                debug: (_r = swOptions.debug) !== null && _r !== void 0 ? _r : options.environment !== 'production'
            }), new InjectManifest({
                swSrc,
                swDest,
                include: serviceWorkerDefaultInclude,
                exclude: serviceWorkerDefaultExclude,
                chunks: [`/${envFile}`],
                ...((_s = swOptions.options) !== null && _s !== void 0 ? _s : {})
            }));
        }
    }
    if (pluginsOptions.additional) {
        plugins = plugins.concat(pluginsOptions.additional);
    }
    return runHook(plugins, pluginsOptions.afterHook);
}
