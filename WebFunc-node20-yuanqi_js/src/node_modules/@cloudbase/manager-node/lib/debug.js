"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
// import { cloudBaseConfig } from '../test/config'
// const app = new CloudBase(cloudBaseConfig)
const app = new index_1.default({});
async function test() {
    // const hosting = await app.hosting.getInfo()
    // const { Bucket, Regoin } = hosting[0]
    // const res = await app.storage.uploadFilesCustom({
    //     files: [
    //         {
    //             localPath: 'test/storage/test_data/data.txt',
    //             cloudPath: 'test/storage/test_data/data.txt'
    //         },
    //         {
    //             localPath: 'test/storage/test_data/download.txt',
    //             cloudPath: 'test/storage/test_data/download.txt'
    //         }
    //     ],
    //     region: Regoin,
    //     bucket: Bucket
    // })
    const res = await app.hosting.uploadFiles({
        localPath: '/Users/wuyiqing/Desktop/cloudbase-demo/functions/node-sdk',
        cloudPath: '',
        onProgress: console.log
    });
    console.log(res);
}
test().catch(console.log);
