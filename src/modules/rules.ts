import globby from 'globby'
import get from 'lodash.get'
import { resolve, sep } from 'path'
import { RuleSetRule } from 'webpack'
import { runHook } from './environment'
import { babelRemoveFunction } from './plugins/babel-remove-function'
import { Babel, Options, Rules } from './types'

export async function checkTypescript(rulesOptions: Rules, srcFolder: string): Promise<boolean> {
  if (typeof rulesOptions.typescript === 'boolean') {
    return rulesOptions.typescript
  }

  return (await globby(resolve(srcFolder, './**/*.ts'))).length > 0
}

export async function checkReact(rulesOptions: Rules, srcFolder: string): Promise<boolean> {
  if (typeof rulesOptions.react === 'boolean') {
    return rulesOptions.react
  }

  return (await globby(resolve(srcFolder, './**/*.(jsx|tsx)'))).length > 0
}

export function normalizeIncludePath(path: string): string {
  const components = path.split(sep)

  if (components[0] === 'src') {
    components.shift()
  } else if (components[0] === 'node_modules') {
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

  const babelPresets: Array<Array<string | object> | string> = [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: get(babelOptions, 'browsersWhiteList', [
            'last 2 versions',
            'not ie <= 11',
            /*
              Android is excluded due to https://github.com/babel/babel/issues/8351
              We support Android > 5, which is in sync with Chrome, so support is guaranteed
            */
            'not android < 5'
          ])
        },
        exclude: get(babelOptions, 'exclude', []),
        modules: get(babelOptions, 'modules', false)
      }
    ]
  ]

  const babelPlugins: Array<Function | string | [string, object]> = [
    ['@babel/plugin-proposal-class-properties', { loose: false }],
    '@babel/plugin-proposal-optional-catch-binding'
  ]

  if (options.environment === 'production') {
    const removeFunctions: Array<string> = get(babelOptions, 'removeFunctions', ['debugClassName'])!

    if (removeFunctions.length) {
      for (const name of removeFunctions) {
        babelPlugins.unshift(babelRemoveFunction({ name }))
      }
    }
  }

  const babelConfiguration = get(babelOptions, 'configuration', {})

  let rules: Array<RuleSetRule> = []

  if (useBabel) {
    rules.push({
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: { presets: babelPresets, plugins: babelPlugins, ...babelConfiguration }
      }
    })
  }

  if (useTypescript) {
    rules.push({
      test: /\.ts$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: { presets: babelPresets.concat('@babel/typescript'), plugins: babelPlugins, ...babelConfiguration }
      }
    })
  }

  if (useReact) {
    rules.push({
      test: /\.jsx$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: { presets: babelPresets.concat('@babel/react'), plugins: babelPlugins, ...babelConfiguration }
      }
    })

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
      })
    }
  }

  if (get(rulesOptions, 'images', true)) {
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
    })
  }

  if (rulesOptions.additional) {
    rules = rules.concat(rulesOptions.additional)
  }

  return runHook(rules, rulesOptions.afterHook)
}
