import { BaseNode, CallExpression, FunctionDeclaration, ImportDeclaration, StringLiteral } from '@babel/types';
interface Types {
    isCallExpression(node: object): node is CallExpression;
    StringLiteral(value: string): StringLiteral;
}
interface NodePath<C, P = unknown> {
    node: C;
    parent: P;
    remove(): void;
    replaceWith(node: BaseNode): void;
}
export declare function babelRemoveFunction(options?: {
    name?: string;
}): ({ types: t }: {
    types: Types;
}) => {
    visitor: {
        Function(path: NodePath<FunctionDeclaration, unknown>): void;
        ImportDeclaration(path: NodePath<ImportDeclaration, unknown>): void;
        CallExpression(path: NodePath<CallExpression, CallExpression>): void;
    };
};
export {};
