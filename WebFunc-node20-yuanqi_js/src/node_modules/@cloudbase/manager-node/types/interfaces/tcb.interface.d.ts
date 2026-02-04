import { IResponseInfo } from './base.interface';
export interface EndUserInfo {
    UUId?: string;
    WXOpenId?: string;
    QQOpenId?: string;
    Phone?: string;
    Email?: string;
    NickName?: string;
    Gender?: string;
    AvatarUrl?: string;
    UpdateTime?: string;
    CreateTime?: string;
}
export interface AuthDomain {
    Id?: string;
    Domain?: string;
    Type?: string;
    Status?: string;
    CreateTime?: string;
    UpdateTime?: string;
}
export interface LoginConfigItem {
    Platform?: string;
    PlatformId?: string;
    CreateTime?: string;
    UpdateTime?: string;
    Status?: string;
    Id?: string;
}
export interface FunctionLimit {
    NumberLimit?: number;
    CallLimit?: LimitInfo;
    ResourceUsageLimit?: LimitInfo;
    ConcurrentLimit?: number;
    OutboundTrafficLimit?: LimitInfo;
}
export interface StorageLimit {
    CapacityLimit?: number;
    DownloadLimit?: LimitInfo;
    UploadLimit?: LimitInfo;
    CdnOriginFlowLimit?: LimitInfo;
    CdnFlowLimit?: LimitInfo;
    UploadLimitMonthly?: LimitInfo;
    DownloadLimitMonthly?: LimitInfo;
}
export interface DatabaseLimit {
    CapacityLimit?: number;
    ConnectionLimit?: number;
    CollectionLimit?: number;
    IndexLimit?: number;
    ReadLimit?: LimitInfo;
    WriteLimit?: LimitInfo;
    QPSLimit?: number;
}
export interface LimitInfo {
    MaxSize?: number;
    TimeUnit?: string;
}
export interface UserInfo {
    OpenId?: string;
    GrantUserInfo?: boolean;
    NickName?: string;
    Country?: string;
    Province?: string;
    City?: string;
    Gender?: number;
    Language?: string;
    AvatarUrl?: string;
    CreateTime?: string;
    UpdateTime?: string;
}
export interface ResourcesInfo {
    ResourceType?: string;
    ResourceName: string;
    Status: number;
    MaxSize: number;
    CurSize: number;
    Unit: string;
}
export interface InvoicePostInfo {
    PostId: string;
    Contact?: string;
    Province?: string;
    City?: string;
    Address?: string;
    PostalCode?: string;
    Cellphone?: string;
}
export interface RecoverResult {
    Result?: string;
    ErrorMessage: string;
    RecoverJobId: string;
}
export interface RecoverJobStatus {
    JobId?: string;
    Status?: string;
    ErrorMessage: string;
}
export interface StorageException {
    Bucket?: string;
    COSStatus?: string;
    COSRecoverJobId: string;
}
export interface LogServiceException {
    LogsetName?: string;
    Status?: string;
    FunctionUpdateJobId: string;
}
export interface EnvInfo {
    EnvId?: string;
    Source?: string;
    Alias?: string;
    CreateTime?: string;
    UpdateTime?: string;
    Status?: string;
    Databases?: DatabasesInfo[];
    Storages?: StorageInfo[];
    Functions?: FunctionInfo[];
    PackageId: string;
    PackageName: string;
    LogServices: LogServiceInfo[];
    CustomLogServices: {
        CreateTime: string;
        ClsLogsetId: string;
        ClsTopicId: string;
        ClsRegion: string;
    }[];
}
export interface FunctionInfo {
    Namespace?: string;
    Region?: string;
}
export interface DatabasesInfo {
    InstanceId?: string;
    Status?: string;
    Region?: string;
}
export interface StorageInfo {
    Region?: string;
    Bucket?: string;
    CdnDomain?: string;
    AppId?: string;
}
export interface LogServiceInfo {
    LogsetName?: string;
    LogsetId?: string;
    TopicName?: string;
    TopicId?: string;
    Region?: string;
}
export interface VoucherUseHistory {
    VoucherId?: string;
    UsedAmount?: number;
    UsedTime?: string;
    PayInfo?: string;
    SeqId?: string;
}
export interface Volucher {
    VoucherId?: string;
    OwnerUin?: string;
    Amount?: number;
    LeftAmount?: number;
    UseDeadLine?: string;
    Status: number;
    BaseAmount?: number;
}
export interface PackageInfo {
    PackageId?: string;
    Name?: string;
    Desc?: string;
    Detail?: string;
}
export interface EnvBillingInfoItem {
    EnvId?: string;
    PackageId?: string;
    IsAutoRenew?: boolean;
    Status?: string;
    PayMode?: string;
    IsolatedTime?: string;
    ExpireTime?: string;
    CreateTime?: string;
    UpdateTime?: string;
    IsAlwaysFree?: boolean;
}
export interface InvoiceVATGeneral {
    TaxPayerType?: string;
    TaxPayerNumber?: string;
    BankDeposit?: string;
    BankAccount?: string;
    RegisterAddress?: string;
    RegisterPhone?: string;
}
export interface InvoiceVATSpecial {
    TaxPayerNumber?: string;
    BankDeposit?: string;
    BankAccount?: string;
    RegisterAddress?: string;
    RegisterPhone?: string;
}
export interface InvoiceBasicInfo {
    InvoiceId?: string;
    UserType?: string;
    Amount?: number;
    Status?: string;
    InvoiceTime?: string;
}
export interface QuotaOverlimit {
    ResourceName?: string;
    QuotaName?: string;
    QuotaChName?: string;
    QuotaUsaged?: number;
    Unit?: string;
    Comments: string;
}
export interface InvoiceAmountOverlimit {
    IsAmountOverlimit?: boolean;
    RefundAmount?: number;
    InvoiceAmount?: number;
}
export interface DealInfo {
    TranId?: string;
    DealOwner?: string;
    CreateTime?: string;
    PackageId?: string;
    DealStatus?: number;
    DealCost?: number;
    EnvId?: string;
    PayTime?: string;
    TimeSpan?: number;
    Price?: number;
    PayMode?: number;
    ProductName?: string;
    TimeUnit?: string;
    RefundAmount?: number;
    DealStatusDes: string;
    VoucherDecline: number;
    HasReturnPayCode: boolean;
}
export interface MonitorResource {
    Name?: string;
    Index?: string[];
    Period?: number[];
    EnIndex?: string[];
    EnName?: string;
    IndexUnit?: string[];
    Convergence?: number[];
    ConvergenceName?: string[];
}
export interface CollectionDispension {
    CollectionName?: string;
    DocCount?: number;
}
export interface MonitorPolicyInfo {
    Name?: string;
    PolicyId: number;
    Note?: string;
    Convergence?: number;
    ResType: string;
    ResName: string;
    Objects: string[];
}
export interface FileDownloadRespInfo {
    FileId?: string;
    DownloadUrl?: string;
    Code?: string;
}
export interface FileDownloadReqInfo {
    FileId?: string;
    TTL: number;
}
export interface FileDeleteInfo {
    FileId?: string;
    Code?: string;
}
export interface CommParam {
    OpenId: string;
    EnvName?: string;
    Module?: string;
}
export interface CloudBaseGWAPI {
    ServiceId: string;
    APIId: string;
    Path: string;
    Type: number;
    Name: string;
    CreateTime: number;
}
export interface CloudBaseGWService {
    ServiceId: string;
    Domain: string;
    OpenTime: number;
}
export interface ICreatePostpayRes extends IResponseInfo {
    TranId: string;
}
export interface ICreateFunctionHttpServiceRes extends IResponseInfo {
    APIId: string;
    Endpoint: string;
}
export interface IGWOrDomainNumRes extends IResponseInfo {
    Count: number;
}
export interface IHttpServiceDomainRes extends IResponseInfo {
    ServiceSet: Array<CloudBaseGWService>;
}
