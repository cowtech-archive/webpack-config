import {
  BaseNode,
  CallExpression,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  StringLiteral
} from '@babel/types'

interface Types {
  isCallExpression(node: object): node is CallExpression
  StringLiteral(value: string): StringLiteral
}

interface NodePath<C, P = unknown> {
  node: C
  parent: P
  remove(): void
  replaceWith(node: BaseNode): void
}

export function babelRemoveFunction(options?: { name?: string }) {
  if (!options || typeof options.name !== 'string') throw new Error('Please provide a function name in the options.')

  return function babelRemoveFunctionInstance({ types: t }: { types: Types }) {
    return {
      visitor: {
        // Remove any definition of the function
        Function(path: NodePath<FunctionDeclaration>) {
          if (path.node.id && path.node.id.name === 'debugClassName') path.remove()
        },
        // Remove any import of the function
        ImportDeclaration(path: NodePath<ImportDeclaration>) {
          const hasDebugName = (path.node.specifiers as Array<ImportSpecifier>).findIndex(
            s => s.imported && s.imported.name === 'debugClassName'
          )

          if (hasDebugName >= 0) {
            if (path.node.specifiers.length === 1) {
              // If debugName is the only imported, just remove the statement completely
              path.remove()
            } else {
              // Just remove the debugName import
              path.node.specifiers.splice(hasDebugName, 1)
            }
          }
        },
        // Remove any call to the function. If used inside style, we drop the call entirely, otherwise we replace with a empty string
        CallExpression(path: NodePath<CallExpression, CallExpression>) {
          if ((path.node.callee as Identifier).name === 'debugClassName') {
            if (t.isCallExpression(path.parent) && (path.parent.callee as Identifier).name === 'style') {
              path.parent.arguments.shift()
            } else {
              path.replaceWith(t.StringLiteral(''))
            }
          }
        }
      }
    }
  }
}
