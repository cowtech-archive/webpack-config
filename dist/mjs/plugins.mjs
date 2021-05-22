import { cacheName } from '@cowtech/webpack-utils';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import globby from 'globby';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { resolve } from 'path';
import { Compilation, DefinePlugin, EnvironmentPlugin, HotModuleReplacementPlugin, sources } from 'webpack';
// @ts-expect-error - Even if @types/webpack-bundle-analyzer, it generates a conflict with Webpack 5. Revisit in the future.
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { InjectManifest } from 'workbox-webpack-plugin';
import { runHook } from "./environment.js";
export * from "./babel-remove-function.js";
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
    constructor(dest, version, workboxVersion, debug) {
        this.dest = dest;
        this.content = `self.__version = '${version}'\nself.__debug = ${debug};`;
        this.workboxUrl = `https://storage.googleapis.com/workbox-cdn/releases/${workboxVersion}/workbox-sw.js`;
    }
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('ServiceWorkerEnvironment', (current) => {
            current.hooks.processAssets.tap({
                name: 'ServiceWorkerEnvironment',
                stage: Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS
            }, () => {
                current.emitAsset(this.dest, new sources.RawSource(this.content));
            });
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            current.getCache(cacheName).storePromise('service-worker-environment', null, this.dest);
        });
        compiler.hooks.compilation.tap('ServiceWorkerEnvironment', (current) => {
            current.hooks.processAssets.tap({
                name: 'ServiceWorkerEnvironment',
                stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE
            }, () => {
                const serviceWorkerAsset = current.getAsset('sw.js');
                if (!serviceWorkerAsset) {
                    return;
                }
                const source = serviceWorkerAsset.source.source();
                current.updateAsset('sw.js', new sources.RawSource(source.replace('importScripts([])', `importScripts('/${this.dest}', '${this.workboxUrl}')`)));
            });
        });
    }
}
class HtmlWebpackTrackerPlugin {
    constructor() {
        this.files = new Map();
    }
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('HtmlWebpackTrackerPlugin', (current) => {
            const plugin = HtmlWebpackPlugin;
            plugin
                .getHooks(current)
                .afterEmit.tapPromise('HtmlWebpackTrackerPlugin', ({ outputName, plugin }) => {
                return current
                    .getCache(cacheName)
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
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
    if (options.environment !== 'production' && hmr) {
        plugins.push(new HotModuleReplacementPlugin());
    }
    if (analyze) {
        if (options.environment !== 'production') {
            const analyzerMode = typeof analyze === 'string' ? analyze : 'server';
            plugins.push(new BundleAnalyzerPlugin({
                analyzerMode: analyzerMode,
                analyzerHost: (_k = (_j = options.server) === null || _j === void 0 ? void 0 : _j.host) !== null && _k !== void 0 ? _k : 'home.cowtech.it',
                analyzerPort: ((_m = (_l = options.server) === null || _l === void 0 ? void 0 : _l.port) !== null && _m !== void 0 ? _m : 4200) + 2,
                generateStatsFile: analyze === 'static',
                openAnalyzer: false,
                logLevel: 'error'
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
            const hash = createHash('sha1')
                .update(JSON.stringify({ version: options.version }))
                .digest('hex')
                .slice(0, 8);
            const swDest = (_o = swOptions.dest) !== null && _o !== void 0 ? _o : 'sw.js';
            const envFile = swDest.replace(/\.js$/, `-env-${hash}.js`);
            const wbInfo = JSON.parse(readFileSync(resolve(process.cwd(), './node_modules/workbox-sw/package.json'), 'utf-8'));
            serviceWorkerDefaultExclude.push(envFile);
            plugins.push(new InjectManifest({
                swSrc,
                swDest,
                include: serviceWorkerDefaultInclude,
                exclude: serviceWorkerDefaultExclude,
                webpackCompilationPlugins: [
                    new ServiceWorkerEnvironment(envFile, options.version, wbInfo.version, (_p = swOptions.debug) !== null && _p !== void 0 ? _p : options.environment !== 'production')
                ],
                ...((_q = swOptions.options) !== null && _q !== void 0 ? _q : {})
            }));
        }
    }
    if (pluginsOptions.additional) {
        plugins = plugins.concat(pluginsOptions.additional);
    }
    return runHook(plugins, pluginsOptions.afterHook);
}
