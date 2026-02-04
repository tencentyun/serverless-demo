export interface IModifyServerFlowOption {
    serverName: string;
    versionFlowItems?: ICloudBaseRunVersionFlowItem[];
    trafficType?: string;
}
export interface ICloudBaseRunVersionFlowItem {
    versionName: string;
    flowRatio: number;
    urlParam?: IObjectKV;
    priority?: number;
    isDefaultPriority?: boolean;
}
export interface IObjectKV {
    key: string;
    value: string;
}
export interface IClouBaseRunKVPriority {
    key: string;
    value: string;
    priority: number;
}
