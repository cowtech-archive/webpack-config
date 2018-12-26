"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globby_1 = __importDefault(require("globby"));
const path_1 = require("path");
async function autoDetectEntries(options) {
    const attempts = {
        bundle: await globby_1.default(path_1.resolve(options.srcFolder, 'bundle.(js|ts)')),
        application: await globby_1.default(path_1.resolve(options.srcFolder, 'js/(application|app).(js|ts|jsx|tsx)'))
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
