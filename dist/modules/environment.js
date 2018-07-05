"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const path_1 = require("path");
function setupEnvironment(options) {
    const packageInfo = require(path_1.resolve(process.cwd(), './package.json'));
    const environment = options.environment;
    return Object.assign({ environment, version: options.version, serviceWorkerEnabled: lodash_1.get(options.serviceWorker, 'enabled', options.environment === 'production') }, lodash_1.get(packageInfo, 'site.common', {}), lodash_1.get(packageInfo, `site.${environment}`, {}), lodash_1.get(options, 'additionalEnvironment', {}));
}
exports.setupEnvironment = setupEnvironment;
