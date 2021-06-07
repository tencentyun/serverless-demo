"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareBuilder = void 0;
const dependencies_decorator_1 = require("@nestjs/common/decorators/core/dependencies.decorator");
const utils_1 = require("./utils");
const iterare_1 = require("iterare");
class MiddlewareBuilder {
    constructor(routesMapper, httpAdapter) {
        this.routesMapper = routesMapper;
        this.httpAdapter = httpAdapter;
        this.middlewareCollection = new Set();
    }
    apply(...middleware) {
        return new MiddlewareBuilder.ConfigProxy(this, dependencies_decorator_1.flatten(middleware));
    }
    build() {
        return [...this.middlewareCollection];
    }
    getHttpAdapter() {
        return this.httpAdapter;
    }
}
exports.MiddlewareBuilder = MiddlewareBuilder;
MiddlewareBuilder.ConfigProxy = class {
    constructor(builder, middleware) {
        this.builder = builder;
        this.middleware = middleware;
        this.excludedRoutes = [];
    }
    getExcludedRoutes() {
        return this.excludedRoutes;
    }
    exclude(...routes) {
        this.excludedRoutes = this.getRoutesFlatList(routes);
        return this;
    }
    forRoutes(...routes) {
        const { middlewareCollection } = this.builder;
        const forRoutes = this.getRoutesFlatList(routes);
        const configuration = {
            middleware: utils_1.filterMiddleware(this.middleware, this.excludedRoutes, this.builder.getHttpAdapter()),
            forRoutes,
        };
        middlewareCollection.add(configuration);
        return this.builder;
    }
    getRoutesFlatList(routes) {
        const { routesMapper } = this.builder;
        return iterare_1.iterate(routes)
            .map(route => routesMapper.mapRouteToRouteInfo(route))
            .flatten()
            .toArray();
    }
};
