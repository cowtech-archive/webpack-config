'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var globby = _interopDefault(require('globby'));
var path = require('path');
var lodash = require('lodash');
var HtmlWebpackPlugin = _interopDefault(require('html-webpack-plugin'));
var UglifyJsPlugin = _interopDefault(require('uglifyjs-webpack-plugin'));
var webpack = require('webpack');
var webpackBundleAnalyzer = require('webpack-bundle-analyzer');
var workboxWebpackPlugin = require('workbox-webpack-plugin');
var fsExtra = require('fs-extra');

async function autoDetectEntries(options) {
    const attempts = {
        bundle: await globby(path.resolve(options.srcFolder, 'bundle.(js|ts)')),
        application: await globby(path.resolve(options.srcFolder, 'js/(application|app).(js|ts|jsx|tsx)'))
    };
    if (attempts.bundle.length) {
        return { 'bundle.js': attempts.bundle[0] };
    }
    else if (attempts.application.length) {
        return { 'js/app.js': attempts.application[0] };
    }
    throw new Error('Unable to autodetect the main entry file. Please specify entries manually.');
}

function setupEnvironment(options) {
    const packageInfo = require(path.resolve(process.cwd(), './package.json'));
    const environment = options.environment;
    return Object.assign({ environment, version: options.version, serviceWorkerEnabled: false }, lodash.get(packageInfo, 'site.common', {}), lodash.get(packageInfo, `site.${environment}`, {}));
}

function generateSVG(icon, tag) {
    const def = icon.icon;
    return `<svg id="${tag}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def[0]} ${def[1]}"><path fill="currentColor" d="${def[4]}"></path></svg>`;
}
async function loadFontAwesomeIcons(icons, toLoad) {
    const dependencies = require(path.resolve(process.cwd(), './package.json')).dependencies;
    icons.tags = toLoad.reduce((accu, entry, index) => {
        // Manipulate the icon name - Syntax: [alias@]<icon>[:section]
        const [alias, rawName] = entry.includes('@') ? entry.split('@') : [entry.replace(/:.+/, ''), entry];
        const [name, section] = rawName.includes(':') ? rawName.split(':') : [rawName, 'solid'];
        const tag = `i${index}`;
        const iconPackage = `@fortawesome/fontawesome-free-${section}`;
        // Check font-awesome exists in dependencies
        if (!dependencies.hasOwnProperty(iconPackage)) {
            throw new Error(`In order to load the "${entry}" icon, please add ${iconPackage} to the package.json dependencies.`);
        }
        // Load the icon then add to the definitions
        const icon = require(path.resolve(process.cwd(), `node_modules/${iconPackage}/${lodash.camelCase(`fa_${name}`)}`));
        icons.definitions += generateSVG(icon, tag);
        accu[alias] = tag;
        return accu;
    }, {});
}

async function loadIcons(options) {
    const toLoad = lodash.get(options, 'icons', {});
    let icons = { tags: {}, definitions: '' };
    // Font Awesome
    if (toLoad.fontawesome)
        await loadFontAwesomeIcons(icons, toLoad.fontawesome);
    return icons;
}

async function getIndexFile(options) {
    let index = lodash.get(options, 'index', true);
    if (index === true) {
        index = (await globby(path.resolve(options.srcFolder, './index.html.(js|ts|jsx|tsx)')))[0];
    }
    return typeof index === 'string' ? index : null;
}
async function getServiceWorkerFile(options) {
    let file = lodash.get(options, 'serviceWorker.src', null);
    if (!file) {
        file = (await globby(path.resolve(options.srcFolder, './(service-worker|sw).(js|ts)')))[0];
    }
    return file;
}
async function setupPlugins(options) {
    const pluginsOptions = options.plugins || {};
    const swOptions = options.serviceWorker || {};
    const indexFile = await getIndexFile(options);
    let plugins = [
        new webpack.EnvironmentPlugin({
            NODE_ENV: options.environment
        }),
        new webpack.DefinePlugin({
            ENV: JSON.stringify(options.env),
            VERSION: JSON.stringify(options.version),
            ICONS: JSON.stringify(options.icons)
        })
    ];
    if (indexFile) {
        plugins.push(new HtmlWebpackPlugin({
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
    if (lodash.get(pluginsOptions, 'concatenate', true))
        plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
    if (options.environment === 'production') {
        if (lodash.get(pluginsOptions, 'minify', true)) {
            plugins.push(new UglifyJsPlugin({ uglifyOptions: lodash.get(options, 'uglify', {}) }));
        }
    }
    else {
        if (lodash.get(pluginsOptions, 'hotModuleReload', true)) {
            plugins.push(new webpack.HotModuleReplacementPlugin());
        }
        const analyze = lodash.get(pluginsOptions, 'analyze', true);
        if (analyze) {
            if (path.basename(process.argv[1]) === 'webpack-dev-server') {
                plugins.push(new webpackBundleAnalyzer.BundleAnalyzerPlugin({
                    analyzerMode: typeof analyze === 'string' ? analyze : 'server',
                    analyzerHost: lodash.get(options, 'server.host', 'home.cowtech.it'),
                    analyzerPort: lodash.get(options, 'server.port', 4200) + 1,
                    generateStatsFile: analyze === 'static',
                    openAnalyzer: false
                }));
            }
            else {
                plugins.push(new webpackBundleAnalyzer.BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    generateStatsFile: true,
                    openAnalyzer: false
                }));
            }
        }
    }
    if (lodash.get(swOptions, 'enabled', null) === true || options.environment === 'production') {
        let swSrc = await getServiceWorkerFile(options);
        if (swSrc) {
            plugins.push(new workboxWebpackPlugin.InjectManifest(Object.assign({ swSrc, swDest: lodash.get(swOptions, 'dest', 'sw.js'), include: [/\.(html|js|json|css)$/, /\/images.+\.(bmp|jpg|jpeg|png|svg|webp)$/], exclude: [/\.map$/, /404\.html/] }, lodash.get(swOptions, 'options', {}))));
        }
    }
    if (pluginsOptions.additional)
        plugins = plugins.concat(pluginsOptions.additional);
    if (pluginsOptions && typeof pluginsOptions.afterHook === 'function') {
        plugins = await pluginsOptions.afterHook(plugins);
    }
    return plugins;
}

async function checkTypescript(rulesOptions, srcFolder) {
    if (typeof rulesOptions.typescript === 'boolean')
        return rulesOptions.typescript;
    return (await globby(path.resolve(srcFolder, './**/*.ts'))).length > 0;
}
async function checkReact(rulesOptions, srcFolder) {
    if (typeof rulesOptions.react === 'boolean')
        return rulesOptions.react;
    return (await globby(path.resolve(srcFolder, './**/*.(jsx|tsx)'))).length > 0;
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
async function setupRules(options) {
    const rulesOptions = options.rules || {};
    const babelOptions = options.babel || {};
    const useBabel = lodash.get(rulesOptions, 'babel', true);
    const useTypescript = await checkTypescript(rulesOptions, options.srcFolder);
    const useReact = await checkReact(rulesOptions, options.srcFolder);
    const babelPresets = [
        [
            '@babel/preset-env',
            {
                targets: { browsers: lodash.get(babelOptions, 'browsersWhiteList', ['last 2 versions', 'not ie <= 11']) },
                exclude: lodash.get(babelOptions, 'exclude', ['transform-regenerator']),
                modules: lodash.get(babelOptions, 'modules', false)
            }
        ],
        '@babel/stage-3'
    ];
    const babelConfiguration = lodash.get(babelOptions, 'configuration', {});
    let rules = [];
    if (useBabel) {
        rules.push({
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: Object.assign({ presets: babelPresets }, babelConfiguration)
            }
        });
    }
    if (useTypescript) {
        rules.push({
            test: /\.ts$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: Object.assign({ presets: babelPresets.concat('@babel/typescript') }, babelConfiguration)
            }
        });
    }
    if (useReact) {
        rules.push({
            test: /\.jsx$/,
            exclude: /node_modules/,
            use: { loader: 'babel-loader', options: Object.assign({ presets: babelPresets.concat('@babel/react') }, babelConfiguration) }
        });
        if (useTypescript) {
            rules.push({
                test: /\.tsx$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: Object.assign({ presets: babelPresets.concat('@babel/react', '@babel/typescript') }, babelConfiguration)
                }
            });
        }
    }
    if (lodash.get(rulesOptions, 'images', true)) {
        rules.push({
            test: /\.(?:bmp|png|jpg|jpeg|svg|webp)$/,
            use: [
                {
                    loader: 'file-loader',
                    options: { name: '[path][name].[ext]', outputPath: normalizeIncludePath, publicPath: normalizeIncludePath }
                }
            ]
        });
    }
    if (lodash.get(rulesOptions, 'manifest', true)) {
        rules.push({
            test: /manifest\.json$/,
            type: 'javascript/auto',
            use: [
                { loader: 'file-loader', options: { name: 'manifest.json' } },
                { loader: 'string-replace-loader', options: { search: '@version@', replace: options.version } }
            ]
        });
    }
    if (lodash.get(rulesOptions, 'sitemap', true)) {
        rules.push({
            test: /sitemap\.xml$/,
            use: [
                { loader: 'file-loader', options: { name: 'sitemap.xml' } },
                { loader: 'string-replace-loader', options: { search: '@version@', replace: options.version } }
            ]
        });
    }
    if (lodash.get(rulesOptions, 'robots', true)) {
        rules.push({
            test: /robots\.txt$/,
            use: [{ loader: 'file-loader', options: { name: 'robots.txt' } }]
        });
    }
    if (rulesOptions.additional)
        rules = rules.concat(rulesOptions.additional);
    if (rulesOptions && typeof rulesOptions.afterHook === 'function')
        rules = await rulesOptions.afterHook(rules);
    return rules;
}

async function setupServer(options) {
    const serverOptions = options.server || {};
    let https;
    if (!serverOptions.hasOwnProperty('https')) {
        // Autodetect HTTPS
        https = (await globby(path.resolve(process.cwd(), './config/ssl/(private-key|certificate).pem'))).length === 2;
    }
    else {
        https = lodash.get(serverOptions, 'https', false);
    }
    let config = {
        host: lodash.get(serverOptions, 'host', 'home.cowtech.it'),
        port: lodash.get(serverOptions, 'port', 4200),
        https,
        compress: lodash.get(serverOptions, 'compress', true),
        hot: lodash.get(serverOptions, 'hot', true)
    };
    if (config.https) {
        config.https = {
            key: await fsExtra.readFile(path.resolve(process.cwd(), lodash.get(config.https, 'key', './config/ssl/private-key.pem'))),
            cert: await fsExtra.readFile(path.resolve(process.cwd(), lodash.get(config.https, 'cert', './config/ssl/certificate.pem')))
        };
    }
    if (typeof serverOptions.afterHook === 'function')
        config = await serverOptions.afterHook(config);
    return config;
}

async function setup(options = {}) {
    if (!options.environment)
        options.environment = 'development';
    if (!options.version) {
        options.version = new Date()
            .toISOString()
            .replace(/([-:])|(\.\d+Z$)/g, '')
            .replace('T', '.');
    }
    options.srcFolder = path.resolve(process.cwd(), lodash.get(options, 'srcFolder', 'src'));
    options.destFolder = path.resolve(process.cwd(), lodash.get(options, 'destFolder', 'dist'));
    options.env = setupEnvironment(options);
    options.icons = await loadIcons(options);
    let config = {
        mode: options.environment === 'development' ? 'development' : 'production',
        entry: options.entries || (await autoDetectEntries(options)),
        output: {
            filename: lodash.get(options, 'filename', '[name]'),
            path: options.destFolder,
            publicPath: lodash.get(options, 'publicPath', '/'),
            libraryTarget: options.libraryTarget
        },
        target: options.target,
        module: {
            rules: await setupRules(options)
        },
        resolve: { extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'] },
        plugins: await setupPlugins(options),
        externals: options.externals,
        devtool: options.environment === 'development' ? lodash.get(options, 'sourceMaps', 'source-map') : false,
        devServer: await setupServer(options)
    };
    if (typeof options.afterHook === 'function')
        config = await options.afterHook(config);
    return config;
}

exports.setup = setup;
