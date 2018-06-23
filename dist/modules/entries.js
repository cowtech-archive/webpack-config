"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globby = require("globby");
const path_1 = require("path");
async function autoDetectEntries(options) {
    const attempts = {
        bundle: await globby(path_1.resolve(options.srcFolder, 'bundle.(js|ts)')),
        application: await globby(path_1.resolve(options.srcFolder, 'js/(application|app).(js|ts|jsx|tsx)'))
    };
    if (attempts.bundle.length) {
        return { 'bundle.js': attempts.bundle[0] };
    }
    else if (attempts.application.length) {
        return { 'js/app.js': attempts.application[0] };
    }
    throw new Error('Unable to autodetect the main entry file. Please specify entries manually.');
}
exports.autoDetectEntries = autoDetectEntries;
