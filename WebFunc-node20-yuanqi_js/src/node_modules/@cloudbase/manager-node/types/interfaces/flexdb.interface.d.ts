export interface IExistsRes {
    RequestId: string;
    Msg?: string;
    Exists: boolean;
}
export interface IDatabaseTableReq {
    Tag: string;
    TableName: string;
}
export interface IndexInfo {
    Name: string;
    Size: number;
    Keys: Indexkey[];
    Accesses: IndexAccesses;
    Unique: boolean;
}
export interface IndexAccesses {
    Ops: number;
    Since: string;
}
export interface Indexkey {
    Name?: string;
    Direction?: string;
}
export interface DropIndex {
    IndexName: string;
}
export interface CreateIndex {
    IndexName: string;
    MgoKeySchema: MgoKeySchema;
}
export interface MgoKeySchema {
    MgoIndexKeys: MgoIndexKeys[];
    MgoIsUnique: boolean;
}
export interface Pager {
    Offset: number;
    Limit: number;
    Total: number;
}
export interface MgoIndexKeys {
    Name: string;
    Direction: string;
}
export interface TableInfo {
    TableName: string;
    CollectionName: string;
    Count: number;
    Size: number;
    IndexCount: number;
    IndexSize: number;
}
export interface GoodsDetail {
    QuataId: string;
    DiskSize?: number;
    ConnNum?: number;
    ReadOperands?: number;
    WriteOperands?: number;
    CollectionLimits?: number;
    SingleCollectionIndexLimits?: number;
}
export interface ResourceAmount {
    UsedDiskSize?: number;
    ReadOperands?: number;
    WriteOperands?: number;
    TableNum?: number;
}
