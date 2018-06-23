"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globby_1 = require("globby");
// @ts-ignore
const html_webpack_plugin_1 = require("html-webpack-plugin");
const lodash_1 = require("lodash");
const path_1 = require("path");
// @ts-ignore
const uglifyjs_webpack_plugin_1 = require("uglifyjs-webpack-plugin");
const webpack_1 = require("webpack");
// @ts-ignore
const webpack_bundle_analyzer_1 = require("webpack-bundle-analyzer");
// @ts-ignore
const workbox_webpack_plugin_1 = require("workbox-webpack-plugin");
async function getIndexFile(options) {
    let index = lodash_1.get(options, 'index', true);
    if (index === true) {
        index = (await globby_1.default(path_1.resolve(options.srcFolder, './index.html.(js|ts|jsx|tsx)')))[0];
    }
    return typeof index === 'string' ? index : null;
}
exports.getIndexFile = getIndexFile;
async function getServiceWorkerFile(options) {
    let file = lodash_1.get(options, 'serviceWorker.src', null);
    if (!file) {
        file = (await globby_1.default(path_1.resolve(options.srcFolder, './(service-worker|sw).(js|ts)')))[0];
    }
    return file;
}
exports.getServiceWorkerFile = getServiceWorkerFile;
async function setupPlugins(options) {
    const pluginsOptions = options.plugins || {};
    const swOptions = options.serviceWorker || {};
    const indexFile = await getIndexFile(options);
    let plugins = [
        new webpack_1.EnvironmentPlugin({
            NODE_ENV: options.environment
        }),
        new webpack_1.DefinePlugin({
            ENV: JSON.stringify(options.env),
            VERSION: JSON.stringify(options.version),
            ICONS: JSON.stringify(options.icons)
        })
    ];
    if (indexFile) {
        plugins.push(new html_webpack_plugin_1.default({
            template: indexFile,
            minify: { collapseWhitespace: true },
            inject: false,
            excludeAssets: [/\.js$/]
        }));
    }
    /*
    const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
  
    if (transpilers.includes('typescript'))
      plugins.push(
        new ForkTsCheckerWebpackPlugin({
          checkSyntacticErrors: true,
          async: !typescript.strict,
          workers: ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE
        })
      )
    */
    if (lodash_1.get(pluginsOptions, 'concatenate', true))
        plugins.push(new webpack_1.optimize.ModuleConcatenationPlugin());
    if (options.environment === 'production') {
        if (lodash_1.get(pluginsOptions, 'minify', true)) {
            plugins.push(new uglifyjs_webpack_plugin_1.default({ uglifyOptions: lodash_1.get(options, 'uglify', {}) }));
        }
    }
    else {
        if (lodash_1.get(pluginsOptions, 'hotModuleReload', true)) {
            plugins.push(new webpack_1.HotModuleReplacementPlugin());
        }
        const analyze = lodash_1.get(pluginsOptions, 'analyze', true);
        if (analyze) {
            if (path_1.basename(process.argv[1]) === 'webpack-dev-server') {
                plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin({
                    analyzerMode: typeof analyze === 'string' ? analyze : 'server',
                    analyzerHost: lodash_1.get(options, 'server.host', 'home.cowtech.it'),
                    analyzerPort: lodash_1.get(options, 'server.port', 4200) + 1,
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
    }
    if (lodash_1.get(swOptions, 'enabled', null) === true || options.environment === 'production') {
        let swSrc = await getServiceWorkerFile(options);
        if (swSrc) {
            plugins.push(new workbox_webpack_plugin_1.InjectManifest(Object.assign({ swSrc, swDest: lodash_1.get(swOptions, 'dest', 'sw.js'), include: [/\.(html|js|json|css)$/, /\/images.+\.(bmp|jpg|jpeg|png|svg|webp)$/], exclude: [/\.map$/, /404\.html/] }, lodash_1.get(swOptions, 'options', {}))));
        }
    }
    if (pluginsOptions.additional)
        plugins = plugins.concat(pluginsOptions.additional);
    if (pluginsOptions && typeof pluginsOptions.afterHook === 'function') {
        plugins = await pluginsOptions.afterHook(plugins);
    }
    return plugins;
}
exports.setupPlugins = setupPlugins;
