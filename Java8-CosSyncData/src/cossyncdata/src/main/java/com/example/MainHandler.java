package com.example;

import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.exception.CosClientException;
import com.qcloud.cos.model.GetObjectRequest;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.PutObjectRequest;
import com.qcloud.cos.model.PutObjectResult;
import com.qcloud.cos.region.Region;
import com.qcloud.services.scf.runtime.events.CosEvent;

import java.io.File;
import java.lang.reflect.Field;
import java.util.*;

public class MainHandler {
    public String mainHandler(CosEvent event) {
        System.out.println("Start main handler");

        String sourceSecretId = System.getenv("SOURCE_SECRET_ID");
        String sourceSecretKey = System.getenv("SOURCE_SECRET_KEY");
        String sourceRegion = System.getenv("SOURCE_REGION");
        String targetSecretId = System.getenv("TARGET_SECRET_ID");
        String targetSecretKey = System.getenv("TARGET_SECRET_KEY");
        String targetRegion = System.getenv("TARGET_REGION");
        String targetBucket = System.getenv("TARGET_BUCKET");

        // 初始化COS及获取COS文件信息
        List<CosEvent.Record> records = event.getRecords();
        if (records.size() == 0) {
            return "{\"errorMsg\": \"No records found\"}";
        }
        String appID = records.get(0).getCos().getCosBucket().getAppid();
        String bucketName = records.get(0).getCos().getCosBucket().getName();
        String bucket = bucketName + "-" + appID;
        String key = records.get(0).getCos().getCosObject().getKey();
        key = key.replace('/' + appID + '/' + bucketName + '/', "");

        // 提取文件名
        String filename = key.substring(key.lastIndexOf("\\") + 1);
        String downloadPath = String.format("/tmp/%s", filename);

        System.out.println("File_name is " + key);
        System.out.println("download_path is " + downloadPath);
        System.out.printf("Get from [%s] to download file [%s]%n", bucket, key);

        // 从COS下载需要同步的文件
        COSCredentials sourceCred = new BasicCOSCredentials(sourceSecretId, sourceSecretKey);
        COSClient sourceCosClient = new COSClient(sourceCred, new ClientConfig(new Region(sourceRegion)));

        File downloadFile = new File(downloadPath);
        String sourceMd5;
        try {
            GetObjectRequest getObjectRequest = new GetObjectRequest(bucket, key);
            ObjectMetadata cosObject = sourceCosClient.getObject(getObjectRequest, downloadFile);
            sourceMd5 = cosObject.getETag();
            System.out.printf("下载文件的MD5是%s%n", sourceMd5);
            System.out.printf("Download file [%s] Success%n", key);
        } catch (CosClientException ex) {
            System.out.printf("Download file [%s] Fail%n", key);
            System.out.println(ex.getErrorCode());
            System.out.println(ex.getMessage());
            deleteLocalFile(downloadPath);
            return String.format("Download file [%s] from [%s] fail", key, bucket);
        }

        // 同步文件到另外一个账号的COS bucket
        System.out.println("Start to upload file to target_bucket");
        COSCredentials targetCred = new BasicCOSCredentials(targetSecretId, targetSecretKey);
        COSClient targetCosClient = new COSClient(targetCred, new ClientConfig(new Region(targetRegion)));
        try {
            PutObjectRequest putObjectRequest = new PutObjectRequest(targetBucket, key, downloadFile);
            PutObjectResult putObjectResult = targetCosClient.putObject(putObjectRequest);
            String targetMd5 = putObjectResult.getContentMd5();
            System.out.printf("上传文件的MD5是%s%n", targetMd5);
            if (!Objects.equals(sourceMd5, targetMd5)) {
                //TODO: 添加相关逻辑处理不匹配的情况，比如删除文件并重新上传等
                System.out.println("MD5不匹配");
            } else {
                System.out.println("MD5匹配");
            }
            System.out.println("Upload success%n");
        } catch (CosClientException ex) {
            System.out.println(ex.getErrorCode());
            System.out.println(ex.getMessage());
            deleteLocalFile(downloadPath);
            return String.format("Upload file [%s] from [%s] fail", key, bucket);
        }

        deleteLocalFile(downloadPath);
        return "Sync File Success";
    }

    private void deleteLocalFile(String path) {
        System.out.println("Delete files and folders");
        File file = new File(path);
        if (file.isDirectory()) {
            for (File subFile : Objects.requireNonNull(file.listFiles())) {
                subFile.delete();
            }
        }
        if (file.isFile()) {
            file.delete();
        }
    }

    public static void main(String[] args) throws Exception {
        //测试
        HashMap<String, String> newenv = new HashMap<>();
        newenv.put("SOURCE_SECRET_ID", "");
        newenv.put("SOURCE_SECRET_KEY", "");
        newenv.put("SOURCE_REGION", "ap-chengdu");
        newenv.put("TARGET_SECRET_ID", "");
        newenv.put("TARGET_SECRET_KEY", "");
        newenv.put("TARGET_REGION", "ap-guangzhou");
        newenv.put("TARGET_BUCKET", "woody-source-1307427535");
        setEnv(newenv);

        System.out.println("aa");
        CosEvent event = new CosEvent();
        CosEvent.Record record = new CosEvent.Record();
        CosEvent.CosInfo cos = new CosEvent.CosInfo();
        CosEvent.CosBucketInfo cosBucket = new CosEvent.CosBucketInfo();
        cosBucket.setName("woody-chengdu");
        cosBucket.setAppid("1307427535");
        cosBucket.setRegion("ap-chengdu");
        cos.setCosBucket(cosBucket);
        CosEvent.CosObjectInfo cosObject = new CosEvent.CosObjectInfo();
        cosObject.setKey("data/861_8606717.png");
        cos.setCosObject(cosObject);
        record.setCos(cos);
        event.setRecords(Collections.singletonList(record));

        new MainHandler().mainHandler(event);
    }

    private static void setEnv(Map<String, String> newenv) throws Exception {
        try {
            Class<?> processEnvironmentClass = Class.forName("java.lang.ProcessEnvironment");
            Field theEnvironmentField = processEnvironmentClass.getDeclaredField("theEnvironment");
            theEnvironmentField.setAccessible(true);
            Map<String, String> env = (Map<String, String>) theEnvironmentField.get(null);
            env.putAll(newenv);
            Field theCaseInsensitiveEnvironmentField = processEnvironmentClass.getDeclaredField("theCaseInsensitiveEnvironment");
            theCaseInsensitiveEnvironmentField.setAccessible(true);
            Map<String, String> cienv = (Map<String, String>) theCaseInsensitiveEnvironmentField.get(null);
            cienv.putAll(newenv);
        } catch (NoSuchFieldException e) {
            Class[] classes = Collections.class.getDeclaredClasses();
            Map<String, String> env = System.getenv();
            for (Class cl : classes) {
                if ("java.util.Collections$UnmodifiableMap".equals(cl.getName())) {
                    Field field = cl.getDeclaredField("m");
                    field.setAccessible(true);
                    Object obj = field.get(env);
                    Map<String, String> map = (Map<String, String>) obj;
                    map.clear();
                    map.putAll(newenv);
                }
            }
        }
    }
}
