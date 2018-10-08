"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
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
    if (!options.environment || typeof options.environment !== 'string')
        options.environment = 'development';
    if (!options.version)
        options.version = generateVersion();
    options.srcFolder = path_1.resolve(process.cwd(), lodash_1.get(options, 'srcFolder', 'src'));
    options.destFolder = path_1.resolve(process.cwd(), lodash_1.get(options, 'destFolder', 'dist'));
    options.env = environment_1.setupEnvironment(options);
    options.icons = await icons_1.loadIcons(options);
    const server = await server_1.setupServer(options);
    const stats = (server.stats = lodash_1.get(options, 'stats', options.environment === 'production' ? 'normal' : 'errors-only'));
    let config = {
        mode: options.environment === 'production' ? 'production' : 'development',
        entry: options.entries || (await entries_1.autoDetectEntries(options)),
        output: {
            filename: lodash_1.get(options, 'filename', '[name]'),
            path: options.destFolder,
            publicPath: lodash_1.get(options, 'publicPath', '/'),
            libraryTarget: options.libraryTarget
        },
        target: options.target,
        module: {
            rules: await rules_1.setupRules(options)
        },
        resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
        plugins: await plugins_1.setupPlugins(options),
        externals: options.externals,
        devtool: options.environment === 'development' ? lodash_1.get(options, 'sourceMaps', 'source-map') : false,
        devServer: server,
        stats
    };
    if (lodash_1.get(options, 'plugins.concatenate', true))
        config.optimization = Object.assign({}, config.optimization, { concatenateModules: true });
    if (typeof options.afterHook === 'function')
        config = await options.afterHook(config);
    return config;
}
exports.setup = setup;
