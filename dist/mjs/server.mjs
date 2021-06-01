import { readFile } from 'fs/promises';
import globby from 'globby';
import { resolve } from 'path';
import { runHook } from "./environment.mjs";
export async function setupServer(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const serverOptions = (_a = options.server) !== null && _a !== void 0 ? _a : {};
    let https;
    let cert;
    let privkey;
    if (!('https' in serverOptions)) {
        // Autodetect HTTPS
        cert = (await globby(resolve(process.cwd(), './config/ssl/(certificate|cert).pem'))).pop();
        privkey = (await globby(resolve(process.cwd(), './config/ssl/(private-key|privkey).pem'))).pop();
        https = !!(cert && privkey);
    }
    else {
        https = (_b = serverOptions.https) !== null && _b !== void 0 ? _b : false;
    }
    const config = {
        host: (_c = serverOptions.host) !== null && _c !== void 0 ? _c : 'home.cowtech.it',
        port: (_d = serverOptions.port) !== null && _d !== void 0 ? _d : 4200,
        https,
        compress: (_e = serverOptions.compress) !== null && _e !== void 0 ? _e : true,
        historyApiFallback: (_f = serverOptions.history) !== null && _f !== void 0 ? _f : true,
        firewall: (_g = serverOptions.firewall) !== null && _g !== void 0 ? _g : true,
        ...((_h = serverOptions.options) !== null && _h !== void 0 ? _h : {})
    };
    if (config.https) {
        config.https = {
            key: await readFile((_k = (_j = config.https) === null || _j === void 0 ? void 0 : _j.key) !== null && _k !== void 0 ? _k : privkey),
            cert: await readFile((_m = (_l = config.https) === null || _l === void 0 ? void 0 : _l.cert) !== null && _m !== void 0 ? _m : cert)
        };
    }
    return runHook(config, serverOptions.afterHook);
}
