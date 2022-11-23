import { imagesExtensions } from '@cowtech/webpack-utils'
import { globby } from 'globby'
import { resolve } from 'node:path'
import webpack from 'webpack'
import { runHook } from './environment.js'
import { Options, Rules } from './types.js'

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

  const typescriptFiles = await globby(resolve(srcFolder, './**/*.ts'))
  return typescriptFiles.length > 0
}

export async function checkReact(rulesOptions: Rules, srcFolder: string): Promise<boolean> {
  if (typeof rulesOptions.react === 'boolean') {
    return rulesOptions.react
  }

  const reactFiles = await globby(resolve(srcFolder, './**/*.(jsx|tsx)'))
  return reactFiles.length > 0
}

export async function setupRules(options: Options): Promise<webpack.RuleSetRule[]> {
  const rulesOptions: Rules = options.rules ?? {}

  const useSwc = options.useSwc ?? true
  const useTypescript = await checkTypescript(rulesOptions, options.srcFolder!)
  const useReact = await checkReact(rulesOptions, options.srcFolder!)
  const target = rulesOptions.target ?? 'es2020'
  let rules: webpack.RuleSetRule[] = []

  if (useSwc) {
    rules.push({
      test: /\.js$/,
      loader: 'swc-loader',
      options: {
        jsc: {
          target
        }
      }
    })

    if (useReact) {
      rules.push({
        test: /\.jsx$/,
        loader: 'swc-loader',
        options: {
          jsc: {
            parser: {
              jsx: true
            },
            target,
            transform: {
              react: {
                runtime: 'automatic'
              }
            }
          }
        }
      })
    }

    if (useTypescript) {
      rules.push({
        test: /\.ts$/,
        loader: 'swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript'
            },
            target
          }
        }
      })

      if (useReact) {
        rules.push({
          test: /\.tsx$/,
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true
              },
              target,
              transform: {
                react: {
                  runtime: 'automatic'
                }
              }
            }
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
    rules = [...rules, ...rulesOptions.additional]
  }

  return runHook(rules, rulesOptions.afterHook)
}
