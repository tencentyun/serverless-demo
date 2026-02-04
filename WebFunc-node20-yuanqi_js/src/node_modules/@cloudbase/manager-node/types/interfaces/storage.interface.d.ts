export interface IUploadMetadata {
    token: string;
    url: string;
    authorization: string;
    fileId: string;
    cosFileId: string;
    download_url: string;
}
export interface IListFileInfo {
    Key: string;
    LastModified: string;
    ETag: string;
    Size: string;
    Owner: string;
    StorageClass: string;
}
export interface IFileInfo {
    Size: string;
    Type: string;
    Date: string;
    ETag: string;
}
export interface ITempUrlInfo {
    cloudPath: string;
    maxAge?: number;
}
