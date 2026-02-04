import { IServiceVersion, IExistsRes, CreateIndex, DropIndex, IndexInfo, TableInfo, Pager, IResponseInfo, CollectionDispension } from '../interfaces/';
import { Environment } from '../environment';
interface IDatabaseConfig {
    Tag: string;
}
interface IIndexiesInfo {
    CreateIndexes?: Array<CreateIndex>;
    DropIndexes?: Array<DropIndex>;
}
interface ITableInfo extends IResponseInfo {
    Indexes?: Array<IndexInfo>;
    IndexNum?: number;
}
interface IMgoQueryInfo {
    MgoLimit?: number;
    MgoOffset?: number;
}
interface ICollectionInfo extends IResponseInfo {
    Collections: Array<TableInfo>;
    Pager: Pager;
}
interface ICollectionExistInfo extends IResponseInfo {
    IsCreated: boolean;
    ExistsResult: IExistsRes;
}
interface IDistributionInfo extends IResponseInfo {
    Collections: CollectionDispension;
    Count: number;
    Total: number;
}
interface IDatabaseMigrateQueryInfo extends IResponseInfo {
    Status: string;
    RecordSuccess: number;
    RecordFail: number;
    ErrorMsg: string;
    FileUrl: string;
}
interface IDatabaseImportAndExportInfo extends IResponseInfo {
    JobId: number;
}
export declare class DatabaseService {
    static tcbServiceVersion: IServiceVersion;
    static flexdbServiceVersion: IServiceVersion;
    private environment;
    private envId;
    private dbOpService;
    private collOpService;
    private DEFAULT_MGO_OFFSET;
    private DEFAULT_MGO_LIMIT;
    constructor(environment: Environment);
    getCurrEnvironment(): Environment;
    getDatabaseConfig(): IDatabaseConfig;
    checkCollectionExists(collectionName: string): Promise<IExistsRes>;
    createCollection(collectionName: string): Promise<any>;
    deleteCollection(collectionName: string): Promise<any>;
    updateCollection(collectionName: string, indexiesInfo: IIndexiesInfo): Promise<any>;
    describeCollection(collectionName: string): Promise<ITableInfo>;
    listCollections(options?: IMgoQueryInfo): Promise<ICollectionInfo>;
    createCollectionIfNotExists(collectionName: string): Promise<ICollectionExistInfo>;
    checkIndexExists(collectionName: string, indexName: string): Promise<IExistsRes>;
    distribution(): Promise<IDistributionInfo>;
    migrateStatus(jobId: number): Promise<IDatabaseMigrateQueryInfo>;
    import(collectionName: string, file: any, options: any): Promise<IDatabaseImportAndExportInfo>;
    export(collectionName: string, file: any, options: any): Promise<IDatabaseImportAndExportInfo>;
}
export {};
