"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_get_1 = __importDefault(require("lodash.get"));
const path_1 = require("path");
function setupEnvironment(options) {
    const packageInfo = require(path_1.resolve(process.cwd(), './package.json'));
    const environment = options.environment;
    return Object.assign(Object.assign(Object.assign({ environment, version: options.version, serviceWorkerEnabled: lodash_get_1.default(options.serviceWorker, 'enabled', options.environment === 'production') }, lodash_get_1.default(packageInfo, 'site.common', {})), lodash_get_1.default(packageInfo, `site.${environment}`, {})), lodash_get_1.default(options, 'additionalEnvironment', {}));
}
exports.setupEnvironment = setupEnvironment;
async function runHook(input, hook) {
    if (typeof hook !== 'function') {
        return input;
    }
    const output = await hook(input);
    return output ? output : input;
}
exports.runHook = runHook;
