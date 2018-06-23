"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globby = require("globby");
const lodash_1 = require("lodash");
const path_1 = require("path");
async function checkTypescript(rulesOptions, srcFolder) {
    if (typeof rulesOptions.typescript === 'boolean')
        return rulesOptions.typescript;
    return (await globby(path_1.resolve(srcFolder, './**/*.ts'))).length > 0;
}
exports.checkTypescript = checkTypescript;
async function checkReact(rulesOptions, srcFolder) {
    if (typeof rulesOptions.react === 'boolean')
        return rulesOptions.react;
    return (await globby(path_1.resolve(srcFolder, './**/*.(jsx|tsx)'))).length > 0;
}
exports.checkReact = checkReact;
function normalizeIncludePath(path) {
    const components = path.split(path_1.sep);
    if (components[0] === 'src')
        components.shift();
    else if (components[0] === 'node_modules') {
        components.splice(0, components[1][0] === '@' ? 3 : 2); // Remove the folder, the scope (if present) and the package
    }
    return components.join(path_1.sep);
}
exports.normalizeIncludePath = normalizeIncludePath;
async function setupRules(options) {
    const rulesOptions = options.rules || {};
    const babelOptions = options.babel || {};
    const useBabel = lodash_1.get(rulesOptions, 'babel', true);
    const useTypescript = await checkTypescript(rulesOptions, options.srcFolder);
    const useReact = await checkReact(rulesOptions, options.srcFolder);
    const babelPresets = [
        [
            '@babel/preset-env',
            {
                targets: { browsers: lodash_1.get(babelOptions, 'browsersWhiteList', ['last 2 versions', 'not ie <= 11']) },
                exclude: lodash_1.get(babelOptions, 'exclude', ['transform-regenerator']),
                modules: lodash_1.get(babelOptions, 'modules', false)
            }
        ],
        '@babel/stage-3'
    ];
    const babelConfiguration = lodash_1.get(babelOptions, 'configuration', {});
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
    if (lodash_1.get(rulesOptions, 'images', true)) {
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
    if (lodash_1.get(rulesOptions, 'manifest', true)) {
        rules.push({
            test: /manifest\.json$/,
            type: 'javascript/auto',
            use: [
                { loader: 'file-loader', options: { name: 'manifest.json' } },
                { loader: 'string-replace-loader', options: { search: '@version@', replace: options.version } }
            ]
        });
    }
    if (lodash_1.get(rulesOptions, 'sitemap', true)) {
        rules.push({
            test: /sitemap\.xml$/,
            use: [
                { loader: 'file-loader', options: { name: 'sitemap.xml' } },
                { loader: 'string-replace-loader', options: { search: '@version@', replace: options.version } }
            ]
        });
    }
    if (lodash_1.get(rulesOptions, 'robots', true)) {
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
exports.setupRules = setupRules;
