export function babelRemoveFunction(functionToRemove) {
    if (typeof functionToRemove !== 'string') {
        throw new Error('Please provide a function name.');
    }
    return function babelRemoveFunctionInstance({ types: t }) {
        return {
            visitor: {
                // Remove any definition of the function
                Function(path) {
                    if (path.node.id && path.node.id.name === functionToRemove) {
                        path.remove();
                    }
                },
                // Remove any import of the function
                ImportDeclaration(path) {
                    const hasDebugName = path.node.specifiers.findIndex((s) => { var _a; return ((_a = s.imported) === null || _a === void 0 ? void 0 : _a.name) === functionToRemove; });
                    if (hasDebugName >= 0) {
                        if (path.node.specifiers.length === 1) {
                            // If debugName is the only imported, just remove the statement completely
                            path.remove();
                        }
                        else {
                            // Just remove the debugName import
                            path.node.specifiers.splice(hasDebugName, 1);
                        }
                    }
                },
                // Remove any call to the function. If used inside style, we drop the call entirely, otherwise we replace with a empty string
                CallExpression(path) {
                    if (path.node.callee.name === functionToRemove) {
                        if (t.isCallExpression(path.parent) && path.parent.callee.name === 'style') {
                            path.parent.arguments.shift();
                        }
                        else {
                            path.replaceWith(t.StringLiteral(''));
                        }
                    }
                }
            }
        };
    };
}
