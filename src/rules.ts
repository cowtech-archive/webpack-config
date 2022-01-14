import { imagesExtensions } from '@cowtech/webpack-utils'
import { globby } from 'globby'
import { resolve } from 'path'
import webpack from 'webpack'
import { runHook } from './environment'
import { Options, Rules } from './types'

/*
Refresh the following two constants periodically by running with 'last 2 versions' and debug=true
Modifications:
  android: remove - Follows Chrome version
  opera: 60 - Use Chromium
  edge: 18 - 17 is legacy
  ie: remove - Is more than legacy
*/
export const minimumSupportedBrowsers = {
  chrome: '80',
  edge: '80',
  firefox: '75',
  ios: '12',
  opera: '67',
  safari: '12',
  samsung: '10.1'
}

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

export async function setupRules(options: Options): Promise<Array<webpack.RuleSetRule>> {
  const rulesOptions: Rules = options.rules ?? {}

  const useESBuild = options.useESBuild ?? true
  const useTypescript = await checkTypescript(rulesOptions, options.srcFolder!)
  const useReact = await checkReact(rulesOptions, options.srcFolder!)
  const target = rulesOptions.target ?? 'es2020'
  let rules: Array<webpack.RuleSetRule> = []

  if (useESBuild) {
    rules.push({
      test: /\.js$/,
      loader: 'esbuild-loader',
      options: {
        target
      }
    })

    if (useReact) {
      rules.push({
        test: /\.jsx$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx',
          target
        }
      })
    }

    if (useTypescript) {
      rules.push({
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target
        }
      })

      if (useReact) {
        rules.push({
          test: /\.tsx$/,
          loader: 'esbuild-loader',
          options: {
            loader: 'tsx',
            target
          }
        })
      }
    }
  }

  if (rulesOptions.images ?? true) {
    rules.push({
      test: imagesExtensions,
      type: 'asset/resource'
    })
  }

  if (rulesOptions.additional) {
    rules = rules.concat(rulesOptions.additional)
  }

  return runHook(rules, rulesOptions.afterHook)
}
