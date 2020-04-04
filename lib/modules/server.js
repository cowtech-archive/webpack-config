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
async function setupServer(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const serverOptions = (_a = options.server, (_a !== null && _a !== void 0 ? _a : {}));
    let https;
    let cert;
    let privkey;
    if (!('https' in serverOptions)) {
        // Autodetect HTTPS
        cert = (await globby_1.default(path_1.resolve(process.cwd(), './config/ssl/(certificate|cert).pem'))).pop();
        privkey = (await globby_1.default(path_1.resolve(process.cwd(), './config/ssl/(private-key|privkey).pem'))).pop();
        https = !!(cert && privkey);
    }
    else {
        https = (_b = serverOptions.https, (_b !== null && _b !== void 0 ? _b : false));
    }
    const config = {
        host: (_c = serverOptions.host, (_c !== null && _c !== void 0 ? _c : 'home.cowtech.it')),
        port: (_d = serverOptions.port, (_d !== null && _d !== void 0 ? _d : 4200)),
        https,
        compress: (_e = serverOptions.compress, (_e !== null && _e !== void 0 ? _e : true)),
        historyApiFallback: (_f = serverOptions.history, (_f !== null && _f !== void 0 ? _f : true)),
        disableHostCheck: (_g = serverOptions.disableHostCheck, (_g !== null && _g !== void 0 ? _g : true)),
        inline: (_h = serverOptions.inline, (_h !== null && _h !== void 0 ? _h : true)),
        ...(_j = serverOptions.options, (_j !== null && _j !== void 0 ? _j : {}))
    };
    if (config.https) {
        config.https = {
            key: await fs_extra_1.readFile((_l = (_k = config.https) === null || _k === void 0 ? void 0 : _k.key, (_l !== null && _l !== void 0 ? _l : privkey))),
            cert: await fs_extra_1.readFile((_o = (_m = config.https) === null || _m === void 0 ? void 0 : _m.cert, (_o !== null && _o !== void 0 ? _o : cert)))
        };
    }
    return environment_1.runHook(config, serverOptions.afterHook);
}
exports.setupServer = setupServer;
