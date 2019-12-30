import { Environment, Hook, Options } from './types';
export declare function setupEnvironment(options: Options): Environment;
export declare function runHook<T>(input: T, hook?: Hook<T>): Promise<T>;
