"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRules = exports.normalizeAssetPath = exports.checkReact = exports.checkTypescript = exports.unneededBabelPlugins = exports.minimumSupportedBrowsers = void 0;
const webpack_utils_1 = require("@cowtech/webpack-utils");
const globby_1 = __importDefault(require("globby"));
const path_1 = require("path");
const babel_remove_function_1 = require("./babel-remove-function");
const environment_1 = require("./environment");
/*
Refresh the following two constants periodically by running with 'last 2 versions' and debug=true
Modifications:
  android: remove - Follows Chrome version
  opera: 60 - Use Chromium
  edge: 18 - 17 is legacy
  ie: remove - Is more than legacy
*/
exports.minimumSupportedBrowsers = {
    chrome: '80',
    edge: '80',
    firefox: '75',
    ios: '12',
    opera: '67',
    safari: '12',
    samsung: '10.1'
};
exports.unneededBabelPlugins = [
    '@babel/plugin-transform-regenerator',
    '@babel/transform-template-literals',
    '@babel/plugin-transform-function-name',
    '@babel/proposal-async-generator-functions',
    '@babel/proposal-object-rest-spread'
];
async function checkTypescript(rulesOptions, srcFolder) {
    if (typeof rulesOptions.typescript === 'boolean') {
        return rulesOptions.typescript;
    }
    return (await globby_1.default(path_1.resolve(srcFolder, './**/*.ts'))).length > 0;
}
exports.checkTypescript = checkTypescript;
async function checkReact(rulesOptions, srcFolder) {
    if (typeof rulesOptions.react === 'boolean') {
        return rulesOptions.react;
    }
    return (await globby_1.default(path_1.resolve(srcFolder, './**/*.(jsx|tsx)'))).length > 0;
}
exports.checkReact = checkReact;
function normalizeAssetPath({ filename }) {
    const components = filename.split(path_1.sep);
    if (components[0] === 'src') {
        components.shift();
    }
    else if (components[0] === 'node_modules') {
        components.splice(0, components[1][0] === '@' ? 3 : 2); // Remove the folder, the scope (if present) and the package
    }
    return components.join(path_1.sep).replace(webpack_utils_1.imagesExtensions, '-[contenthash]$&');
}
exports.normalizeAssetPath = normalizeAssetPath;
async function setupRules(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const rulesOptions = (_a = options.rules) !== null && _a !== void 0 ? _a : {};
    const babelOptions = (_b = options.babel) !== null && _b !== void 0 ? _b : {};
    const useBabel = (_c = rulesOptions.babel) !== null && _c !== void 0 ? _c : true;
    const useTypescript = await checkTypescript(rulesOptions, options.srcFolder);
    const useReact = await checkReact(rulesOptions, options.srcFolder);
    const babelPresets = [
        [
            '@babel/preset-env',
            {
                targets: (_d = babelOptions.browsersWhiteList) !== null && _d !== void 0 ? _d : exports.minimumSupportedBrowsers,
                exclude: (_e = babelOptions.exclude) !== null && _e !== void 0 ? _e : exports.unneededBabelPlugins,
                modules: (_f = babelOptions.modules) !== null && _f !== void 0 ? _f : false,
                debug: (_g = babelOptions.envDebug) !== null && _g !== void 0 ? _g : false
            }
        ]
    ];
    const babelPlugins = [
        ['@babel/plugin-proposal-class-properties', { loose: false }],
        '@babel/plugin-proposal-optional-catch-binding'
    ];
    if (options.environment === 'production') {
        const removeFunctions = (_h = babelOptions.removeFunctions) !== null && _h !== void 0 ? _h : ['debugClassName'];
        if (removeFunctions.length) {
            for (const name of removeFunctions) {
                babelPlugins.unshift(babel_remove_function_1.babelRemoveFunction(name));
            }
        }
    }
    const babelConfiguration = (_j = babelOptions.configuration) !== null && _j !== void 0 ? _j : {};
    let rules = [];
    if (useBabel) {
        rules.push({
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: { presets: babelPresets, plugins: babelPlugins, ...babelConfiguration }
            }
        });
    }
    if (useTypescript) {
        rules.push({
            test: /\.ts$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: { presets: babelPresets.concat('@babel/typescript'), plugins: babelPlugins, ...babelConfiguration }
            }
        });
    }
    if (useReact) {
        rules.push({
            test: /\.jsx$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: { presets: babelPresets.concat('@babel/react'), plugins: babelPlugins, ...babelConfiguration }
            }
        });
        if (useTypescript) {
            rules.push({
                test: /\.tsx$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: babelPresets.concat('@babel/react', '@babel/typescript'),
                        plugins: babelPlugins,
                        ...babelConfiguration
                    }
                }
            });
        }
    }
    if ((_k = rulesOptions.images) !== null && _k !== void 0 ? _k : true) {
        rules.push({
            test: webpack_utils_1.imagesExtensions,
            type: 'asset/resource'
        });
    }
    if (rulesOptions.additional) {
        rules = rules.concat(rulesOptions.additional);
    }
    return environment_1.runHook(rules, rulesOptions.afterHook);
}
exports.setupRules = setupRules;
