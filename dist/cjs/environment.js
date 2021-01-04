"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHook = exports.setupEnvironment = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function setupEnvironment(options) {
    var _a, _b, _c, _d, _e, _f, _g;
    const packageInfo = JSON.parse(fs_1.readFileSync(path_1.resolve(process.cwd(), './package.json'), 'utf-8'));
    const environment = options.environment;
    return {
        environment,
        version: options.version,
        serviceWorkerEnabled: (_b = (_a = options === null || options === void 0 ? void 0 : options.serviceWorker) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : options.environment === 'production',
        ...((_d = (_c = packageInfo.site) === null || _c === void 0 ? void 0 : _c.common) !== null && _d !== void 0 ? _d : {}),
        ...((_f = (_e = packageInfo.site) === null || _e === void 0 ? void 0 : _e[environment]) !== null && _f !== void 0 ? _f : {}),
        ...((_g = options.additionalEnvironment) !== null && _g !== void 0 ? _g : {})
    };
}
exports.setupEnvironment = setupEnvironment;
async function runHook(input, hook) {
    var _a;
    if (typeof hook !== 'function') {
        return input;
    }
    const output = await hook(input);
    return (_a = output) !== null && _a !== void 0 ? _a : input;
}
exports.runHook = runHook;
