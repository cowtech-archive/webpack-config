import * as webpack from 'webpack';

import {IconsLoader} from './icons';
import {Server} from './index';
import {PluginOptions} from './plugins';
import {Babel} from './rules';
import {ServiceWorker} from './service-worker';

export interface Configuration{
  environment?: string;
  version?: string;
  entries: string | Array<string> | {[key: string]: string};
  distFolder: string;
  transpilers?: Array<string>;
  indexFile?: string | boolean;
  icons?: Array<string>;
  iconsLoader?: IconsLoader;
  plugins?: Array<any>;
  pluginsOptions?: PluginOptions;
  babel?: Babel;
  externals?: Array<string>;
  sourceMapsType?: webpack.Options.Devtool;
  server?: Server;
  serviceWorker?: ServiceWorker | boolean;
  afterRulesHook?(rules: Array<any>): Array<any>;
}

export const defaultConfiguration: Configuration = {
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
    minifyOptions: {mangle: false}, // PI: Remove mangle when Safari 10 is dropped: https://github.com/mishoo/UglifyJS2/issues/1753
    hotModuleReload: true,
    commonChunks: true,
    sizeAnalyzerServer: true
  },
  babel: {
    browsersWhiteList: ['last 2 versions'],
    exclude: ['transform-async-to-generator', 'transform-regenerator'],
    modules: false
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

export function loadConfigurationEntry(key: string, configuration: {[key: string]: any}, defaults: {[key: string]: any} = defaultConfiguration): any{
  return configuration.hasOwnProperty(key) ? configuration[key] : defaults[key];
}
