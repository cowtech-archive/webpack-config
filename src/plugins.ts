import {basename} from 'path';
import * as webpack from 'webpack';

import {Configuration, defaultConfiguration, loadConfigurationEntry} from './configuration';
import {loadIcons} from './icons';
import {TypescriptOptions} from './rules';

export interface PluginOptions{
  concatenate?: boolean;
  minify?: boolean;
  minifyOptions?: any;
  hotModuleReload?: boolean;
  commonChunks?: boolean;
  sizeAnalyzerServer?: boolean;
  afterHook?(plugins: Array<any>): Array<any>;
}

const HtmlWebpackPlugin = require('html-webpack-plugin');
const GraphBundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export function setupPlugins(configuration: Configuration, environment: any): Array<any>{
  const env = configuration.environment;
  const options = configuration.pluginsOptions || {};
  const defaultOptions = defaultConfiguration.pluginsOptions;

  const indexFile = loadConfigurationEntry<string | boolean>('indexFile', configuration);
  const concatenate = loadConfigurationEntry<boolean>('concatenate', options, defaultOptions);
  const minify = loadConfigurationEntry<boolean>('minify', options, defaultOptions);
  const hotModuleReload = loadConfigurationEntry<boolean>('hotModuleReload', options, defaultOptions);
  const commonChunks = loadConfigurationEntry<boolean>('commonChunks', options, defaultOptions);
  const sizeAnalyzerServer = loadConfigurationEntry<boolean>('sizeAnalyzerServer', options, defaultOptions);
  const transpilers = loadConfigurationEntry<Array<string>>('transpilers', configuration);
  const typescript = loadConfigurationEntry<TypescriptOptions>('typescript', configuration);

  let plugins: Array<any> = [
    new webpack.DefinePlugin({
      env: JSON.stringify(environment),
      version: JSON.stringify(environment.version),
      ICONS: JSON.stringify(loadIcons(configuration)),
      'process.env': {NODE_ENV: JSON.stringify(env)} // This is needed by React for production mode
    })
  ];

  if(transpilers.includes('typescript'))
    plugins.push(new ForkTsCheckerWebpackPlugin({checkSyntacticErrors: true, async: !typescript.strict, workers: ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE}));

  if(indexFile)
    plugins.push(new HtmlWebpackPlugin({template: indexFile, minify: {collapseWhitespace: true}, inject: false, excludeAssets: [/\.js$/]}));

  if(concatenate)
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

  if(env === 'production'){
    if(minify)
      plugins.push(new UglifyJsPlugin({uglifyOptions: options.minifyOptions}));
  }else{
    if(hotModuleReload)
      plugins.push(new webpack.HotModuleReplacementPlugin());
    if(commonChunks)
      plugins.push(new webpack.optimize.CommonsChunkPlugin({name: 'webpack-bootstrap.js'}));

    if(sizeAnalyzerServer && basename(process.argv[1]) === 'webpack-dev-server')
      plugins.push(new GraphBundleAnalyzerPlugin({openAnalyzer: false}));
  }

  if(Array.isArray(configuration.plugins))
    plugins.push(...configuration.plugins);

  if(typeof options.afterHook === 'function')
    plugins = options.afterHook(plugins);

  return plugins;
}
