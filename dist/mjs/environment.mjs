import { existsSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import { resolve } from 'path';
export function setupEnvironment(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const environment = options.environment;
    let commonSettings = {};
    let environmentSettings = {};
    // Load settings from config/application.yml or from site key in package.json
    const yamlPath = resolve(process.cwd(), './config/application.yml');
    // Load from YAML file
    if (existsSync(yamlPath)) {
        const configuration = load(readFileSync(yamlPath, 'utf-8'));
        commonSettings = (_a = configuration.common) !== null && _a !== void 0 ? _a : {};
        environmentSettings = (_b = configuration[environment]) !== null && _b !== void 0 ? _b : {};
        // Legacy package.json based configuration
    }
    else {
        const packageInfo = JSON.parse(readFileSync(resolve(process.cwd(), './package.json'), 'utf-8'));
        commonSettings = (_d = (_c = packageInfo.site) === null || _c === void 0 ? void 0 : _c.common) !== null && _d !== void 0 ? _d : {};
        environmentSettings = (_f = (_e = packageInfo.site) === null || _e === void 0 ? void 0 : _e[environment]) !== null && _f !== void 0 ? _f : {};
    }
    return {
        environment,
        version: options.version,
        serviceWorkerEnabled: (_h = (_g = options === null || options === void 0 ? void 0 : options.serviceWorker) === null || _g === void 0 ? void 0 : _g.enabled) !== null && _h !== void 0 ? _h : options.environment === 'production',
        ...commonSettings,
        ...environmentSettings,
        ...((_j = options.additionalEnvironment) !== null && _j !== void 0 ? _j : {})
    };
}
export async function runHook(input, hook) {
    var _a;
    if (typeof hook !== 'function') {
        return input;
    }
    const output = await hook(input);
    return (_a = output) !== null && _a !== void 0 ? _a : input;
}
