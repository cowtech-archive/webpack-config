import { CallExpression, StringLiteral } from '@babel/types';
interface Types {
    isCallExpression: (node: object) => node is CallExpression;
    StringLiteral: (value: string) => StringLiteral;
}
export declare function babelRemoveFunction(functionToRemove: string): (options: {
    types: Types;
}) => object;
export {};
