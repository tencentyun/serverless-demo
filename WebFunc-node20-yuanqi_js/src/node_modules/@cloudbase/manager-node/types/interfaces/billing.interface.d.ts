import { IResponseInfo } from './base.interface';
export interface IGoodItem {
    GoodsCategoryId: number;
    RegionId: number;
    ZoneId: number;
    GoodsNum: number;
    ProjectId: number;
    PayMode: number;
    Platform: number;
    GoodsDetail: string;
}
export interface IGenerateDealsRes extends IResponseInfo {
    OrderIds: Array<string>;
}
export interface IPayDealsRes extends IResponseInfo {
    OrderIds: Array<string>;
    ResourceIds: Array<string>;
}
