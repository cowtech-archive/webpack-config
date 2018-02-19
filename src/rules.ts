import {sep as pathSep} from 'path';

import {Configuration, loadConfigurationEntry} from './configuration';

export interface Babel{
  browsersWhiteList?: Array<string>;
  exclude?: Array<string>;
  modules?: boolean;
}

export interface TypescriptOptions{
  strict?: boolean;
}

export function normalizeIncludePath(path: string): string{
  const components = path.split(pathSep);

  if(components[0] === 'src')
      components.shift();
  else if(components[0] === 'node_modules'){
      components.splice(0, components[1][0] === '@' ? 3 : 2); // Remove the folder, the scope (if present) and the package
  }

  return components.join(pathSep);
}

export function setupRules(configuration: Configuration, version: string){
  const babel = loadConfigurationEntry<Babel>('babel', configuration);
  const transpilers = loadConfigurationEntry<Array<string>>('transpilers', configuration);

  const babelPresets = [
    ['@babel/env', {targets: {browsers: babel.browsersWhiteList}, exclude: babel.exclude, modules: babel.modules}],
    '@babel/stage-3'
  ];

  let rules: Array<any> = [
    {
      test: /\.(?:bmp|png|jpg|jpeg|svg|webp)$/,
      use: [{loader: 'file-loader', options: {name: '[path][name].[ext]', outputPath: normalizeIncludePath, publicPath: normalizeIncludePath}}]
    },
    {
      test: /manifest\.json$/,
      use: [{loader: 'file-loader', options: {name: 'manifest.json'}}, {loader: 'string-replace-loader', query: {search: '@version@', replace: version}}]
    },
    {
      test: /sitemap\.xml$/,
      use: [{loader: 'file-loader', options: {name: 'sitemap.xml'}}, {loader: 'string-replace-loader', query: {search: '@version@', replace: version}}]
    },
    {test: /robots\.txt$/, use: [{loader: 'file-loader', options: {name: 'robots\.txt'}}]}
  ];

  if(transpilers.includes('babel')){
    if(transpilers.includes('inferno')){
      rules.unshift({
        test: /(\.js(x?))$/, exclude: /node_modules/,
        use: {loader: 'babel-loader', options: {presets: babelPresets.concat('@babel/react'), plugins: ['syntax-jsx', ['inferno', {imports: true}]]}}
      });
    }else if(transpilers.includes('react')){
      rules.unshift({
        test: /(\.js(x?))$/, exclude: /node_modules/,
        use: {loader: 'babel-loader', options: {presets: babelPresets.concat('@babel/react')}}
      });
    }else
      rules.unshift({test: /\.js$/, exclude: /node_modules/, use: {loader: 'babel-loader', options: {presets: babelPresets}}});
  }

  if(transpilers.includes('typescript')){
    if(transpilers.includes('inferno')){
      rules.unshift({
        test: /(\.ts(x?))$/,
        use: {
          loader: 'babel-loader',
          options: {presets: babelPresets.concat('@babel/react', '@babel/typescript'), plugins: ['syntax-jsx', ['inferno', {imports: true}]]}
        }
      });
    }else if(transpilers.includes('react')){
      rules.unshift({
        test: /(\.ts(x?))$/,
        use: {loader: 'babel-loader', options: {presets: babelPresets.concat('@babel/react', '@babel/typescript')}}
      });
    }else
      rules.unshift({test: /\.ts$/, use: {loader: 'babel-loader', options: {presets: babelPresets.concat('@babel/typescript')}}});
  }

  if(typeof configuration.afterRulesHook === 'function')
    rules = configuration.afterRulesHook(rules);

  return rules;
}

export function setupResolvers(configuration: Configuration): Array<string>{
  const transpilers = loadConfigurationEntry<Array<string>>('transpilers', configuration);
  const extensions = ['.json', '.js'];

  if(transpilers.includes('babel'))
    extensions.push('.jsx');

  if(transpilers.includes('typescript'))
    extensions.push('.ts', '.tsx');

  return extensions;
}
