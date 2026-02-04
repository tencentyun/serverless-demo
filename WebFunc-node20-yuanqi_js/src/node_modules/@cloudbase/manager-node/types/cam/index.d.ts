import { CloudBaseContext } from '../context';
import { IServiceVersion, IRoleListRes, ICreateRoleRes, IResponseInfo, IGetRoleRes } from '../interfaces';
export declare class CamService {
    static camServiceVersion: IServiceVersion;
    private camService;
    constructor(context: CloudBaseContext);
    /**
     * 查询账户角色列表
     * @param {number} page
     * @param {number} rp
     * @returns {Promise<IRoleListRes>}
     * @memberof CamService
     */
    describeRoleList(page: number, rp: number): Promise<IRoleListRes>;
    /**
     * 获取角色详情
     * @param {string} roleName
     * @returns {Promise<IGetRoleRes>}
     * @memberof CamService
     */
    getRole(roleName: string): Promise<IGetRoleRes>;
    /**
     * 创建角色
     * @param {{
     *         RoleName: string
     *         PolicyDocument: string
     *         Description: string
     *     }} param
     * @returns {Promise<ICreateRoleRes>}
     * @memberof CamService
     */
    createRole(param: {
        RoleName: string;
        PolicyDocument: string;
        Description: string;
    }): Promise<ICreateRoleRes>;
    /**
     * 绑定角色策略
     * @param {{
     *         PolicyId: number
     *         AttachRoleName: string
     *     }} param
     * @returns {Promise<IResponseInfo>}
     * @memberof CamService
     */
    attachRolePolicy(param: {
        PolicyId: number;
        AttachRoleName: string;
    }): Promise<IResponseInfo>;
    attachRolePolicies(param: {
        RoleId?: number;
        RoleName?: string;
        PolicyId?: number[];
        PolicyName?: string[];
    }): Promise<IResponseInfo>;
    /**
     * 删除角色
     * @param {string} roleName
     * @returns {Promise<IResponseInfo>}
     * @memberof CamService
     */
    deleteRole(roleName: string): Promise<IResponseInfo>;
}
