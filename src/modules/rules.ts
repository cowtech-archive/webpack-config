import * as globby from 'globby'
import { get } from 'lodash'
import { resolve, sep } from 'path'
import { RuleSetRule } from 'webpack'
import { Babel, Options, Rules } from './types'

export async function checkTypescript(rulesOptions: Rules, srcFolder: string): Promise<boolean> {
  if (typeof rulesOptions.typescript === 'boolean') return rulesOptions.typescript

  return (await globby(resolve(srcFolder, './**/*.ts'))).length > 0
}

export async function checkReact(rulesOptions: Rules, srcFolder: string): Promise<boolean> {
  if (typeof rulesOptions.react === 'boolean') return rulesOptions.react

  return (await globby(resolve(srcFolder, './**/*.(jsx|tsx)'))).length > 0
}

export function normalizeIncludePath(path: string): string {
  const components = path.split(sep)

  if (components[0] === 'src') components.shift()
  else if (components[0] === 'node_modules') {
    components.splice(0, components[1][0] === '@' ? 3 : 2) // Remove the folder, the scope (if present) and the package
  }

  return components.join(sep)
}

export async function setupRules(options: Options): Promise<Array<RuleSetRule>> {
  const rulesOptions: Rules = options.rules || {}
  const babelOptions: Babel = options.babel || {}

  const useBabel = get(rulesOptions, 'babel', true)
  const useTypescript = await checkTypescript(rulesOptions, options.srcFolder!)
  const useReact = await checkReact(rulesOptions, options.srcFolder!)

  const babelPresets = [
    [
      '@babel/preset-env',
      {
        targets: { browsers: get(babelOptions, 'browsersWhiteList', ['last 2 versions', 'not ie <= 11']) },
        exclude: get(babelOptions, 'exclude', ['transform-regenerator']),
        modules: get(babelOptions, 'modules', false)
      }
    ],
    '@babel/stage-3'
  ]
  const babelConfiguration = get(babelOptions, 'configuration', {})

  let rules: Array<RuleSetRule> = []

  if (useBabel) {
    rules.push({
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: { presets: babelPresets, ...babelConfiguration }
      }
    })
  }

  if (useTypescript) {
    rules.push({
      test: /\.ts$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: { presets: babelPresets.concat('@babel/typescript'), ...babelConfiguration }
      }
    })
  }

  if (useReact) {
    rules.push({
      test: /\.jsx$/,
      exclude: /node_modules/,
      use: { loader: 'babel-loader', options: { presets: babelPresets.concat('@babel/react'), ...babelConfiguration } }
    })

    if (useTypescript) {
      rules.push({
        test: /\.tsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: babelPresets.concat('@babel/react', '@babel/typescript'), ...babelConfiguration }
        }
      })
    }
  }

  if (get(rulesOptions, 'images', true)) {
    rules.push({
      test: /\.(?:bmp|png|jpg|jpeg|svg|webp)$/,
      use: [
        {
          loader: 'file-loader',
          options: { name: '[path][name].[ext]', outputPath: normalizeIncludePath, publicPath: normalizeIncludePath }
        }
      ]
    })
  }

  if (get(rulesOptions, 'manifest', true)) {
    rules.push({
      test: /manifest\.json$/,
      type: 'javascript/auto',
      use: [
        { loader: 'file-loader', options: { name: 'manifest.json' } },
        { loader: 'string-replace-loader', options: { search: '@version@', replace: options.version } }
      ]
    })
  }

  if (get(rulesOptions, 'sitemap', true)) {
    rules.push({
      test: /sitemap\.xml$/,
      use: [
        { loader: 'file-loader', options: { name: 'sitemap.xml' } },
        { loader: 'string-replace-loader', options: { search: '@version@', replace: options.version } }
      ]
    })
  }

  if (get(rulesOptions, 'robots', true)) {
    rules.push({
      test: /robots\.txt$/,
      use: [{ loader: 'file-loader', options: { name: 'robots.txt' } }]
    })
  }

  if (rulesOptions.additional) rules = rules.concat(rulesOptions.additional)
  if (rulesOptions && typeof rulesOptions.afterHook === 'function') rules = await rulesOptions.afterHook(rules)

  return rules
}
