'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

const defaultConfiguration = {
    entries: [],
    distFolder: 'dist',
    transpilers: [],
    indexFile: 'index.html.ejs',
    icons: [],
    iconsLoader: {},
    plugins: [],
    pluginsOptions: {
        concatenate: true,
        minify: true,
        minifyOptions: { mangle: false },
        hotModuleReload: true,
        commonChunks: true,
        sizeAnalyzerServer: true
    },
    babel: {
        browsersWhiteList: ['last 2 versions'],
        exclude: ['transform-async-to-generator', 'transform-regenerator'],
        modules: false
    },
    typescript: {
        strict: true
    },
    externals: [],
    sourceMapsType: 'source-map',
    server: {
        host: 'home.cowtech.it',
        port: 4200,
        https: {
            key: './config/ssl/private-key.pem',
            cert: './config/ssl/certificate.pem'
        },
        historyApiFallback: true,
        compress: true,
        hot: true
    },
    serviceWorker: {
        source: 'sw.js',
        dest: 'sw.js',
        patterns: ['**/*.{html,js,json,css}', 'images/**/*.{bmp,jpg,jpeg,png,svg,webp}'],
        ignores: ['manifest.json', 'sw.js', 'js/workbox.js']
    }
};
function loadConfigurationEntry(key, configuration, defaults = defaultConfiguration) {
    return configuration.hasOwnProperty(key) ? configuration[key] : defaults[key];
}

function loadEnvironment(configuration) {
    const packageInfo = require(path.resolve(process.cwd(), './package.json'));
    const environment = loadConfigurationEntry('environment', configuration);
    const version = loadConfigurationEntry('version', configuration);
    const sw = loadConfigurationEntry('serviceWorker', configuration);
    if (!packageInfo.site)
        packageInfo.site = {};
    return Object.assign({ environment, serviceWorkerEnabled: sw !== false, version: version || new Date().toISOString().replace(/([-:])|(\.\d+Z$)/g, '').replace('T', '.') }, (packageInfo.site.common || {}), (packageInfo.site[environment] || {}));
}

function loadIcons(configuration) {
    const toLoad = loadConfigurationEntry('icons', configuration);
    const iconsLoader = loadConfigurationEntry('iconsLoader', configuration);
    let icons = typeof iconsLoader.loader === 'function' ? iconsLoader.loader(toLoad, iconsLoader) : { tags: {}, definitions: '' };
    if (typeof iconsLoader.afterHook === 'function')
        icons = iconsLoader.afterHook(icons);
    return icons;
}

const HtmlWebpackPlugin = require('html-webpack-plugin');
const GraphBundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
function setupPlugins(configuration, environment) {
    const env = configuration.environment;
    const options = configuration.pluginsOptions || {};
    const defaultOptions = defaultConfiguration.pluginsOptions;
    const indexFile = loadConfigurationEntry('indexFile', configuration);
    const concatenate = loadConfigurationEntry('concatenate', options, defaultOptions);
    const minify = loadConfigurationEntry('minify', options, defaultOptions);
    const hotModuleReload = loadConfigurationEntry('hotModuleReload', options, defaultOptions);
    const commonChunks = loadConfigurationEntry('commonChunks', options, defaultOptions);
    const sizeAnalyzerServer = loadConfigurationEntry('sizeAnalyzerServer', options, defaultOptions);
    const transpilers = loadConfigurationEntry('transpilers', configuration);
    const typescript = loadConfigurationEntry('typescript', configuration);
    let plugins = [
        new webpack.DefinePlugin({
            env: JSON.stringify(environment),
            version: JSON.stringify(environment.version),
            ICONS: JSON.stringify(loadIcons(configuration)),
            'process.env': { NODE_ENV: JSON.stringify(env) } // This is needed by React for production mode
        })
    ];
    if (transpilers.includes('typescript'))
        plugins.push(new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true, async: !typescript.strict, workers: ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE }));
    if (indexFile)
        plugins.push(new HtmlWebpackPlugin({ template: indexFile, minify: { collapseWhitespace: true }, inject: false, excludeAssets: [/\.js$/] }));
    if (concatenate)
        plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
    if (env === 'production') {
        if (minify)
            plugins.push(new UglifyJsPlugin({ uglifyOptions: options.minifyOptions }));
    }
    else {
        if (hotModuleReload)
            plugins.push(new webpack.HotModuleReplacementPlugin());
        if (commonChunks)
            plugins.push(new webpack.optimize.CommonsChunkPlugin({ name: 'webpack-bootstrap.js' }));
        if (sizeAnalyzerServer && path.basename(process.argv[1]) === 'webpack-dev-server')
            plugins.push(new GraphBundleAnalyzerPlugin({ openAnalyzer: false }));
    }
    if (Array.isArray(configuration.plugins))
        plugins.push(...configuration.plugins);
    if (typeof options.afterHook === 'function')
        plugins = options.afterHook(plugins);
    return plugins;
}

function normalizeIncludePath(path$$1) {
    const components = path$$1.split(path.sep);
    if (components[0] === 'src')
        components.shift();
    else if (components[0] === 'node_modules') {
        components.splice(0, components[1][0] === '@' ? 3 : 2); // Remove the folder, the scope (if present) and the package
    }
    return components.join(path.sep);
}
function setupRules(configuration, version) {
    const babel = loadConfigurationEntry('babel', configuration);
    const transpilers = loadConfigurationEntry('transpilers', configuration);
    const babelPresets = [
        ['@babel/env', { targets: { browsers: babel.browsersWhiteList }, exclude: babel.exclude, modules: babel.modules }],
        '@babel/stage-3'
    ];
    let rules = [
        {
            test: /\.(?:bmp|png|jpg|jpeg|svg|webp)$/,
            use: [{ loader: 'file-loader', options: { name: '[path][name].[ext]', outputPath: normalizeIncludePath, publicPath: normalizeIncludePath } }]
        },
        {
            test: /manifest\.json$/,
            use: [{ loader: 'file-loader', options: { name: 'manifest.json' } }, { loader: 'string-replace-loader', query: { search: '@version@', replace: version } }]
        },
        {
            test: /sitemap\.xml$/,
            use: [{ loader: 'file-loader', options: { name: 'sitemap.xml' } }, { loader: 'string-replace-loader', query: { search: '@version@', replace: version } }]
        },
        { test: /robots\.txt$/, use: [{ loader: 'file-loader', options: { name: 'robots\.txt' } }] }
    ];
    if (transpilers.includes('babel')) {
        if (transpilers.includes('inferno')) {
            rules.unshift({
                test: /(\.js(x?))$/, exclude: /node_modules/,
                use: { loader: 'babel-loader', options: { presets: babelPresets.concat('@babel/react'), plugins: ['syntax-jsx', ['inferno', { imports: true }]] } }
            });
        }
        else if (transpilers.includes('react')) {
            rules.unshift({
                test: /(\.js(x?))$/, exclude: /node_modules/,
                use: { loader: 'babel-loader', options: { presets: babelPresets.concat('@babel/react') } }
            });
        }
        else
            rules.unshift({ test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: babelPresets } } });
    }
    if (transpilers.includes('typescript')) {
        if (transpilers.includes('inferno')) {
            rules.unshift({
                test: /(\.ts(x?))$/,
                use: {
                    loader: 'babel-loader',
                    options: { presets: babelPresets.concat('@babel/react', '@babel/typescript'), plugins: ['syntax-jsx', ['inferno', { imports: true }]] }
                }
            });
        }
        else if (transpilers.includes('react')) {
            rules.unshift({
                test: /(\.ts(x?))$/,
                use: { loader: 'babel-loader', options: { presets: babelPresets.concat('@babel/react', '@babel/typescript') } }
            });
        }
        else
            rules.unshift({ test: /\.ts$/, use: { loader: 'babel-loader', options: { presets: babelPresets.concat('@babel/typescript') } } });
    }
    if (typeof configuration.afterRulesHook === 'function')
        rules = configuration.afterRulesHook(rules);
    return rules;
}
function setupResolvers(configuration) {
    const transpilers = loadConfigurationEntry('transpilers', configuration);
    const extensions = ['.json', '.js'];
    if (transpilers.includes('babel'))
        extensions.push('.jsx');
    if (transpilers.includes('typescript'))
        extensions.push('.ts', '.tsx');
    return extensions;
}

const WorkboxPlugin = require('workbox-webpack-plugin');
function setupServiceWorker(config, configuration) {
    const options = loadConfigurationEntry('serviceWorker', configuration);
    const distFolder = loadConfigurationEntry('distFolder', configuration);
    const source = loadConfigurationEntry('source', options, defaultConfiguration.serviceWorker);
    const dest = loadConfigurationEntry('dest', options, defaultConfiguration.serviceWorker);
    const globPatterns = loadConfigurationEntry('patterns', options, defaultConfiguration.serviceWorker);
    const globIgnores = loadConfigurationEntry('ignores', options, defaultConfiguration.serviceWorker);
    const templatedUrls = loadConfigurationEntry('templatedUrls', options, defaultConfiguration.serviceWorker);
    const transpilers = loadConfigurationEntry('transpilers', configuration);
    if (options === false)
        return config;
    config.entry[dest] = options.template || `./src/js/service-worker.${transpilers.includes('typescript') ? 'ts' : 'js'}`;
    config.module.rules.unshift({
        test: /workbox-sw\.[a-z]+\..+\.js$/,
        use: [{ loader: 'file-loader', options: { name: 'js/workbox.js' } }, { loader: 'babel-loader', options: { presets: ['minify', { comments: false }] } }]
    });
    let plugin = new WorkboxPlugin({ swSrc: `${distFolder}/${source}`, swDest: `${distFolder}/${dest}`, globPatterns, globIgnores, templatedUrls });
    if (typeof options.afterHook === 'function')
        plugin = options.afterHook(plugin);
    config.plugins.push(plugin);
    return config;
}

function setupServer(configuration) {
    const server = configuration.server || {};
    const defaultServer = defaultConfiguration.server;
    const https = loadConfigurationEntry('https', server, defaultServer);
    let config = {
        host: loadConfigurationEntry('host', server, defaultServer),
        port: loadConfigurationEntry('port', server, defaultServer),
        historyApiFallback: loadConfigurationEntry('historyApiFallback', server, defaultServer),
        compress: loadConfigurationEntry('compress', server, defaultServer),
        hot: loadConfigurationEntry('hot', server, defaultServer)
    };
    if (https) {
        config.https = {
            key: https.key || fs.readFileSync(path.resolve(process.cwd(), defaultServer.https.key)),
            cert: https.cert || fs.readFileSync(path.resolve(process.cwd(), defaultServer.https.cert))
        };
    }
    if (typeof server.afterHook === 'function')
        config = server.afterHook(config);
    return config;
}
function setup(env, configuration, afterHook) {
    if (!env)
        env = 'development';
    if (!configuration.environment)
        configuration.environment = env;
    const environment = loadEnvironment(configuration);
    const destination = path.resolve(process.cwd(), configuration.distFolder || defaultConfiguration.distFolder);
    const version = JSON.stringify(environment.version);
    const plugins = setupPlugins(configuration, environment);
    let config = {
        entry: configuration.entries || defaultConfiguration.entries,
        output: { filename: '[name]', path: destination, publicPath: '/' },
        module: {
            rules: setupRules(configuration, version)
        },
        resolve: { extensions: setupResolvers(configuration) },
        plugins,
        externals: configuration.externals,
        devtool: env === 'development' ? (configuration.sourceMapsType || defaultConfiguration.sourceMapsType) : false,
        devServer: Object.assign({ contentBase: destination }, setupServer(configuration))
    };
    if (env === 'production')
        config = setupServiceWorker(config, configuration);
    if (typeof afterHook === 'function')
        config = afterHook(config);
    return config;
}

exports.setupServer = setupServer;
exports.setup = setup;
exports.defaultConfiguration = defaultConfiguration;
exports.loadConfigurationEntry = loadConfigurationEntry;
exports.loadEnvironment = loadEnvironment;
exports.loadIcons = loadIcons;
exports.setupPlugins = setupPlugins;
exports.normalizeIncludePath = normalizeIncludePath;
exports.setupRules = setupRules;
exports.setupResolvers = setupResolvers;
