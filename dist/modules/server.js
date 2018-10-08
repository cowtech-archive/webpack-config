"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const fs_extra_1 = require("fs-extra");
const globby = require("globby");
const lodash_1 = require("lodash");
const path_1 = require("path");
async function setupServer(options) {
    const serverOptions = options.server || {};
    let https;
    if (!serverOptions.hasOwnProperty('https')) {
        // Autodetect HTTPS
        https = (await globby(path_1.resolve(process.cwd(), './config/ssl/(private-key|certificate).pem'))).length === 2;
    }
    else {
        https = lodash_1.get(serverOptions, 'https', false);
    }
    let config = {
        host: lodash_1.get(serverOptions, 'host', 'home.cowtech.it'),
        port: lodash_1.get(serverOptions, 'port', 4200),
        https,
        compress: lodash_1.get(serverOptions, 'compress', true),
        historyApiFallback: lodash_1.get(serverOptions, 'history', true)
    };
    if (config.https) {
        config.https = {
            key: await fs_extra_1.readFile(path_1.resolve(process.cwd(), lodash_1.get(config.https, 'key', './config/ssl/private-key.pem'))),
            cert: await fs_extra_1.readFile(path_1.resolve(process.cwd(), lodash_1.get(config.https, 'cert', './config/ssl/certificate.pem')))
        };
    }
    if (typeof serverOptions.afterHook === 'function')
        config = await serverOptions.afterHook(config);
    return config;
}
exports.setupServer = setupServer;
