"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
function setupEnvironment(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageInfo = require(path_1.resolve(process.cwd(), './package.json'));
    const environment = options.environment;
    return {
        environment,
        version: options.version,
        serviceWorkerEnabled: (_c = (_b = (_a = options) === null || _a === void 0 ? void 0 : _a.serviceWorker) === null || _b === void 0 ? void 0 : _b.enabled, (_c !== null && _c !== void 0 ? _c : options.environment === 'production')),
        ...(_e = (_d = packageInfo.site) === null || _d === void 0 ? void 0 : _d.common, (_e !== null && _e !== void 0 ? _e : {})),
        ...(_g = (_f = packageInfo.site) === null || _f === void 0 ? void 0 : _f[environment], (_g !== null && _g !== void 0 ? _g : {})),
        ...(_h = options.additionalEnvironment, (_h !== null && _h !== void 0 ? _h : {}))
    };
}
exports.setupEnvironment = setupEnvironment;
async function runHook(input, hook) {
    var _a;
    if (typeof hook !== 'function') {
        return input;
    }
    const output = await hook(input);
    return _a = output, (_a !== null && _a !== void 0 ? _a : input);
}
exports.runHook = runHook;
