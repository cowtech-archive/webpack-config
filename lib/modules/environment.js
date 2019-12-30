"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const utils_1 = require("./utils");
function setupEnvironment(options) {
    const packageInfo = require(path_1.resolve(process.cwd(), './package.json'));
    const environment = options.environment;
    return Object.assign(Object.assign(Object.assign({ environment, version: options.version, serviceWorkerEnabled: utils_1.get(options.serviceWorker, 'enabled', options.environment === 'production') }, utils_1.get(packageInfo, 'site.common', {})), utils_1.get(packageInfo, `site.${environment}`, {})), utils_1.get(options, 'additionalEnvironment', {}));
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
