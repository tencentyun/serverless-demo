export interface ICreateAccessOptions {
    path: string;
    name: string;
    type?: 1 | 2;
    auth?: boolean;
}
export interface IApi {
    ServiceId: string;
    APIId: string;
    Path: string;
    Type: number;
    Name: string;
    CreateTime: number;
    EnvId: string;
    EnableAuth: boolean;
}
export interface IUpdateOptions {
    apiIds: string[];
    auth: boolean;
}
export interface IService {
    ServiceId: string;
    Domain: string;
    OpenTime: number;
    Status?: number;
}
export interface IDeleteOptions {
    name?: string;
    type?: number;
    apiId?: string;
    path?: string;
}
export interface IGetOptions {
    path?: string;
    name?: string;
    limit?: number;
    offset?: number;
}
export interface IDomainOptions {
    domain: string;
    certId?: string;
}
