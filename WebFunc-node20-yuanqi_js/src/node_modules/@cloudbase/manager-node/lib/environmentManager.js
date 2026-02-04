"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentManager = void 0;
const environment_1 = require("./environment");
const constant_1 = require("./constant");
class EnvironmentManager {
    constructor(context) {
        this.envs = {};
        this.currentEnv = null;
        this.cloudBaseContext = context;
    }
    getCurrentEnv() {
        if (!this.currentEnv) {
            throw new Error(constant_1.ERROR.CURRENT_ENVIRONMENT_IS_NULL);
        }
        return this.currentEnv;
    }
    add(envId) {
        if (!this.envs[envId]) {
            this.envs[envId] = new environment_1.Environment(this.cloudBaseContext, envId);
        }
        if (!this.currentEnv) {
            this.currentEnv = this.envs[envId];
        }
    }
    remove(envId) {
        this.envs[envId] = null;
        delete this.envs[envId];
    }
    get(envId) {
        return this.envs[envId] || null;
    }
    switchEnv(envId) {
        const env = this.envs[envId];
        if (env) {
            this.currentEnv = env;
            return true;
        }
        else {
            return false;
        }
    }
}
exports.EnvironmentManager = EnvironmentManager;
