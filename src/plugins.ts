import {basename} from 'path';
import * as webpack from 'webpack';

import {Configuration, defaultConfiguration, loadConfigurationEntry} from './configuration';
import {loadIcons} from './icons';

export interface PluginOptions{
  concatenate?: boolean;
  minify?: boolean;
  minifyOptions?: any;
  hotModuleReload?: boolean;
  commonChunks?: boolean;
  sizeAnalyzerServer?: boolean;
  afterHook?(plugins: Array<any>): Array<any>;
}

const HtmlWebpackPlugin: any = require('html-webpack-plugin');
const GraphBundleAnalyzerPlugin: any = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const BabiliPlugin: any = require('babili-webpack-plugin');

export function setupPlugins(configuration: Configuration, environment: any): Array<any>{
  const env: string = configuration.environment;
  const options: PluginOptions = configuration.pluginsOptions || {};
  const defaultOptions: PluginOptions = defaultConfiguration.pluginsOptions;

  const indexFile: string | boolean = loadConfigurationEntry('indexFile', configuration);
  const concatenate: boolean = loadConfigurationEntry('concatenate', options, defaultOptions);
  const minify: boolean = loadConfigurationEntry('minify', options, defaultOptions);
  const hotModuleReload: boolean = loadConfigurationEntry('hotModuleReload', options, defaultOptions);
  const commonChunks: boolean = loadConfigurationEntry('commonChunks', options, defaultOptions);
  const sizeAnalyzerServer: boolean = loadConfigurationEntry('sizeAnalyzerServer', options, defaultOptions);

  let plugins: Array<any> = [
    new webpack.DefinePlugin({
      env: JSON.stringify(environment),
      version: JSON.stringify(environment.version),
      ICONS: JSON.stringify(loadIcons(configuration)),
      'process.env': {NODE_ENV: JSON.stringify(env)} // This is needed by React for production mode
    })
  ];

  if(indexFile)
    plugins.push(new HtmlWebpackPlugin({template: indexFile, minify: {collapseWhitespace: true}, inject: false, excludeAssets: [/\.js$/]}));

  if(concatenate)
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

  if(env === 'production'){
    if(minify)
      plugins.push(new BabiliPlugin(options.minifyOptions));
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
