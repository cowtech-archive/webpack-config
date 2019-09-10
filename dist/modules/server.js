"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const fs_extra_1 = require("fs-extra");
const globby_1 = __importDefault(require("globby"));
const lodash_get_1 = __importDefault(require("lodash.get"));
const path_1 = require("path");
const environment_1 = require("./environment");
async function setupServer(options) {
    const serverOptions = options.server || {};
    let https;
    if (!serverOptions.hasOwnProperty('https')) {
        // Autodetect HTTPS
        https = (await globby_1.default(path_1.resolve(process.cwd(), './config/ssl/(private-key|certificate).pem'))).length === 2;
    }
    else {
        https = lodash_get_1.default(serverOptions, 'https', false);
    }
    let config = Object.assign({ host: lodash_get_1.default(serverOptions, 'host', 'home.cowtech.it'), port: lodash_get_1.default(serverOptions, 'port', 4200), https, compress: lodash_get_1.default(serverOptions, 'compress', true), historyApiFallback: lodash_get_1.default(serverOptions, 'history', true), disableHostCheck: lodash_get_1.default(serverOptions, 'disableHostCheck', true), inline: lodash_get_1.default(serverOptions, 'inline', true) }, lodash_get_1.default(serverOptions, 'options', {}));
    if (config.https) {
        config.https = {
            key: await fs_extra_1.readFile(path_1.resolve(process.cwd(), lodash_get_1.default(config.https, 'key', './config/ssl/private-key.pem'))),
            cert: await fs_extra_1.readFile(path_1.resolve(process.cwd(), lodash_get_1.default(config.https, 'cert', './config/ssl/certificate.pem')))
        };
    }
    return environment_1.runHook(config, serverOptions.afterHook);
}
exports.setupServer = setupServer;
