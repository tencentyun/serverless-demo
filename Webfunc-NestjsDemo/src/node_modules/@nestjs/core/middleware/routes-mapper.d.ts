import { RouteInfo, Type } from '@nestjs/common/interfaces';
import { NestContainer } from '../injector/container';
export declare class RoutesMapper {
    private readonly routerExplorer;
    constructor(container: NestContainer);
    mapRouteToRouteInfo(route: Type<any> | RouteInfo | string): RouteInfo[];
    private isRouteInfo;
    private validateGlobalPath;
    private validateRoutePath;
}
