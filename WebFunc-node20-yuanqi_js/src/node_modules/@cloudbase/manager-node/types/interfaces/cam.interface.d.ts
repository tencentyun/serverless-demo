import { IResponseInfo } from './base.interface';
interface IRoleInfo {
    RoleId: string;
    RoleName: string;
    PolicyDocument: string;
    Description: string;
    AddTime: string;
    UpdateTime: string;
    ConsoleLogin: number;
}
export interface IRoleListRes extends IResponseInfo {
    List: Array<IRoleInfo>;
    TotalNum: number;
}
export interface ICreateRoleRes extends IResponseInfo {
    RoleId: string;
}
export interface ICheckTcbServiceRes extends IResponseInfo {
    Initialized: boolean;
}
export interface IGetRoleRes extends IResponseInfo {
    RoleInfo: IRoleInfo;
}
export {};
