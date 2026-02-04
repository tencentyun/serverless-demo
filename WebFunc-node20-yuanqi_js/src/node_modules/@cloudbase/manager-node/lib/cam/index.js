"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CamService = void 0;
const utils_1 = require("../utils");
class CamService {
    constructor(context) {
        this.camService = new utils_1.CloudService(context, CamService.camServiceVersion.service, CamService.camServiceVersion.version);
    }
    /**
     * 查询账户角色列表
     * @param {number} page
     * @param {number} rp
     * @returns {Promise<IRoleListRes>}
     * @memberof CamService
     */
    async describeRoleList(page, rp) {
        return this.camService.request('DescribeRoleList', {
            Page: page,
            Rp: rp
        });
    }
    /**
     * 获取角色详情
     * @param {string} roleName
     * @returns {Promise<IGetRoleRes>}
     * @memberof CamService
     */
    async getRole(roleName) {
        return this.camService.request('GetRole', {
            RoleName: roleName
        });
    }
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
    async createRole(param) {
        return this.camService.request('CreateRole', param);
    }
    /**
     * 绑定角色策略
     * @param {{
     *         PolicyId: number
     *         AttachRoleName: string
     *     }} param
     * @returns {Promise<IResponseInfo>}
     * @memberof CamService
     */
    async attachRolePolicy(param) {
        return this.camService.request('AttachRolePolicy', param);
    }
    async attachRolePolicies(param) {
        return this.camService.request('AttachRolePolicies', param);
    }
    /**
     * 删除角色
     * @param {string} roleName
     * @returns {Promise<IResponseInfo>}
     * @memberof CamService
     */
    async deleteRole(roleName) {
        return this.camService.request('DeleteRole', {
            RoleName: roleName
        });
    }
}
exports.CamService = CamService;
CamService.camServiceVersion = {
    service: 'cam',
    version: '2019-01-16'
};
