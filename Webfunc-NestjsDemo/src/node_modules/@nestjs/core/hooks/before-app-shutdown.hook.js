"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callBeforeAppShutdownHook = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const transient_instances_1 = require("../injector/helpers/transient-instances");
/**
 * Checks if the given instance has the `beforeApplicationShutdown` function
 *
 * @param instance The instance which should be checked
 */
function hasBeforeApplicationShutdownHook(instance) {
    return !shared_utils_1.isNil(instance.beforeApplicationShutdown);
}
/**
 * Calls the given instances
 */
function callOperator(instances, signal) {
    return iterare_1.iterate(instances)
        .filter(instance => !shared_utils_1.isNil(instance))
        .filter(hasBeforeApplicationShutdownHook)
        .map(async (instance) => instance.beforeApplicationShutdown(signal))
        .toArray();
}
/**
 * Calls the `beforeApplicationShutdown` function on the module and its children
 * (providers / controllers).
 *
 * @param module The module which will be initialized
 * @param signal The signal which caused the shutdown
 */
async function callBeforeAppShutdownHook(module, signal) {
    const providers = module.getNonAliasProviders();
    const [_, moduleClassHost] = providers.shift();
    const instances = [...module.controllers, ...providers];
    const nonTransientInstances = transient_instances_1.getNonTransientInstances(instances);
    await Promise.all(callOperator(nonTransientInstances, signal));
    const transientInstances = transient_instances_1.getTransientInstances(instances);
    await Promise.all(callOperator(transientInstances, signal));
    const moduleClassInstance = moduleClassHost.instance;
    if (moduleClassInstance &&
        hasBeforeApplicationShutdownHook(moduleClassInstance) &&
        moduleClassHost.isDependencyTreeStatic()) {
        await moduleClassInstance.beforeApplicationShutdown(signal);
    }
}
exports.callBeforeAppShutdownHook = callBeforeAppShutdownHook;
