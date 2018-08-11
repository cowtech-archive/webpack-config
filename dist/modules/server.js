"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const history = require("connect-history-api-fallback");
const fs_extra_1 = require("fs-extra");
const globby = require("globby");
// @ts-ignore
const convert = require("koa-connect");
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
        hot: lodash_1.get(serverOptions, 'hot', true),
        add(app, middleware, options) {
            const add = lodash_1.get(serverOptions, 'add', null);
            let historyOptions = lodash_1.get(serverOptions, 'history', true);
            if (historyOptions) {
                if (typeof historyOptions === 'boolean')
                    historyOptions = {};
                app.use(convert(history(historyOptions)));
            }
            if (typeof add === 'function') {
                add(app, middleware, options);
            }
        }
    };
    if (config.hot === true) {
        config.hot = config.hotClient = {
            https: !!config.https,
            port: config.port + 1
        };
    }
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
