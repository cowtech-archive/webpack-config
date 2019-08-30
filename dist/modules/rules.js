"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globby_1 = __importDefault(require("globby"));
const lodash_get_1 = __importDefault(require("lodash.get"));
const path_1 = require("path");
const environment_1 = require("./environment");
const babel_remove_function_1 = require("./plugins/babel-remove-function");
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
function normalizeIncludePath(path) {
    const components = path.split(path_1.sep);
    if (components[0] === 'src') {
        components.shift();
    }
    else if (components[0] === 'node_modules') {
        components.splice(0, components[1][0] === '@' ? 3 : 2); // Remove the folder, the scope (if present) and the package
    }
    return components.join(path_1.sep);
}
exports.normalizeIncludePath = normalizeIncludePath;
async function setupRules(options) {
    const rulesOptions = options.rules || {};
    const babelOptions = options.babel || {};
    const useBabel = lodash_get_1.default(rulesOptions, 'babel', true);
    const useTypescript = await checkTypescript(rulesOptions, options.srcFolder);
    const useReact = await checkReact(rulesOptions, options.srcFolder);
    const babelPresets = [
        [
            '@babel/preset-env',
            {
                targets: {
                    browsers: lodash_get_1.default(babelOptions, 'browsersWhiteList', [
                        'last 2 versions',
                        'not ie <= 11',
                        /*
                          Android is excluded due to https://github.com/babel/babel/issues/8351
                          We support Android > 5, which is in sync with Chrome, so support is guaranteed
                        */
                        'not android < 5'
                    ])
                },
                exclude: lodash_get_1.default(babelOptions, 'exclude', []),
                modules: lodash_get_1.default(babelOptions, 'modules', false)
            }
        ]
    ];
    const babelPlugins = [
        ['@babel/plugin-proposal-class-properties', { loose: false }],
        '@babel/plugin-proposal-optional-catch-binding'
    ];
    if (options.environment === 'production') {
        const removeFunctions = lodash_get_1.default(babelOptions, 'removeFunctions', ['debugClassName']);
        if (removeFunctions.length) {
            for (const name of removeFunctions) {
                babelPlugins.unshift(babel_remove_function_1.babelRemoveFunction({ name }));
            }
        }
    }
    const babelConfiguration = lodash_get_1.default(babelOptions, 'configuration', {});
    let rules = [];
    if (useBabel) {
        rules.push({
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: Object.assign({ presets: babelPresets, plugins: babelPlugins }, babelConfiguration)
            }
        });
    }
    if (useTypescript) {
        rules.push({
            test: /\.ts$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: Object.assign({ presets: babelPresets.concat('@babel/typescript'), plugins: babelPlugins }, babelConfiguration)
            }
        });
    }
    if (useReact) {
        rules.push({
            test: /\.jsx$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: Object.assign({ presets: babelPresets.concat('@babel/react'), plugins: babelPlugins }, babelConfiguration)
            }
        });
        if (useTypescript) {
            rules.push({
                test: /\.tsx$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: Object.assign({ presets: babelPresets.concat('@babel/react', '@babel/typescript'), plugins: babelPlugins }, babelConfiguration)
                }
            });
        }
    }
    if (lodash_get_1.default(rulesOptions, 'images', true)) {
        rules.push({
            test: /\.(?:bmp|png|jpg|jpeg|gif|svg|webp)$/,
            use: [
                {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name]-[hash].[ext]',
                        outputPath: normalizeIncludePath,
                        publicPath: normalizeIncludePath
                    }
                }
            ]
        });
    }
    if (rulesOptions.additional) {
        rules = rules.concat(rulesOptions.additional);
    }
    return environment_1.runHook(rules, rulesOptions.afterHook);
}
exports.setupRules = setupRules;
