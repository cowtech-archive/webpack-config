"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const fs_extra_1 = require("fs-extra");
const globby_1 = __importDefault(require("globby"));
const path_1 = require("path");
const environment_1 = require("./environment");
const utils_1 = require("./utils");
async function setupServer(options) {
    const serverOptions = options.server || {};
    let https;
    if (!serverOptions.hasOwnProperty('https')) {
        // Autodetect HTTPS
        https = (await globby_1.default(path_1.resolve(process.cwd(), './config/ssl/(private-key|certificate).pem'))).length === 2;
    }
    else {
        https = utils_1.get(serverOptions, 'https', false);
    }
    let config = Object.assign({ host: utils_1.get(serverOptions, 'host', 'home.cowtech.it'), port: utils_1.get(serverOptions, 'port', 4200), https, compress: utils_1.get(serverOptions, 'compress', true), historyApiFallback: utils_1.get(serverOptions, 'history', true), disableHostCheck: utils_1.get(serverOptions, 'disableHostCheck', true), inline: utils_1.get(serverOptions, 'inline', true) }, utils_1.get(serverOptions, 'options', {}));
    if (config.https) {
        config.https = {
            key: await fs_extra_1.readFile(path_1.resolve(process.cwd(), utils_1.get(config.https, 'key', './config/ssl/private-key.pem'))),
            cert: await fs_extra_1.readFile(path_1.resolve(process.cwd(), utils_1.get(config.https, 'cert', './config/ssl/certificate.pem')))
        };
    }
    return environment_1.runHook(config, serverOptions.afterHook);
}
exports.setupServer = setupServer;
