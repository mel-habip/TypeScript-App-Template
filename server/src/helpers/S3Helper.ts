import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from "crypto"

const buckets = {
    Bucket1: process.env.S3_BUCKET_!,
    Bucket2: process.env.S3_BUCKET_2,
};

export default class S3Helper {
    private s3Client: S3Client;
    constructor(bucketType: keyof typeof buckets = 'Bucket1') {
        this.Bucket = buckets[bucketType];
        this.s3Client = new S3Client({
            region: 'us-east-2',
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY as string,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
            },
        });
    }

    private Bucket: string;

    putObject = async (file: Buffer, options: {
        name: string,
        fileType?: never
    } | {
        name?: never
        fileType: string
    }): Promise<{ statusCode?: number, key: string, Bucket: string } | void> => {
        const uploadParams = {
            Bucket: this.Bucket,
            Key: options.name ? options.name : (crypto.randomUUID().toString() + '.' + options.fileType),
            Body: file
        };

        try {
            const data = await this.s3Client.send(new PutObjectCommand(uploadParams));
            return {
                statusCode: data.$metadata.httpStatusCode,
                key: uploadParams.Key,
                Bucket: this.Bucket,
            };
        } catch (error) {
            throw new Error(`Failed to upload object: ${error.message}`);
        }
    };

    deleteObject = async (key: string) => {
        const params = {
            Bucket: this.Bucket,
            Key: key
        };
        try {
            const data = await this.s3Client.send(new DeleteObjectCommand(params));
            return data;
        } catch (error) {
            throw new Error(`Failed to upload object: ${error.message}`);
        }
    };

    getObject = async (key: string): Promise<Uint8Array> => {
        const getObjectParams = {
            Bucket: this.Bucket,
            Key: key,
        };

        let handleError = (error) => {
            console.log('tried to access: ', getObjectParams);
            throw new Error(`Failed to retrieve object: ${error.message}`);
        }

        try {
            const data = await this.s3Client.send(new GetObjectCommand(getObjectParams));
            if (!data.Body) throw Error(`No Body in file.`);
            // const res = await data.Body.transformToString();
            return await data.Body.transformToByteArray();
        } catch (error) {
            console.log('tried to access: ', getObjectParams);
            throw new Error(`Failed to retrieve object: ${error.message}`);
        }
    }

    getPresignedGetUrl = async (key: string, expirationInSeconds: number = 3600): Promise<string> => {
        const getObjectParams = {
            Bucket: this.Bucket,
            Key: key,
        };

        try {
            const presignedUrl = await getSignedUrl(this.s3Client, new GetObjectCommand(getObjectParams), { expiresIn: expirationInSeconds });
            return presignedUrl;
        } catch (error) {
            throw new Error(`Failed to get presigned GET URL: ${error.message}`);
        }
    }

    getPresignedPutUrl = async (key: string, expirationInSeconds: number = 300): Promise<string> => {
        const putObjectParams = {
            Bucket: this.Bucket,
            Key: key,
            ContentType: 'application/octet-stream', // Set the content type as needed
            ACL: 'private', // access control level, can also be 'public-read' or 'public-read-write' but in our case it should be private
        };

        try {
            const presignedPutUrl = await getSignedUrl(this.s3Client, new PutObjectCommand(putObjectParams), {
                expiresIn: expirationInSeconds,
            });
            return presignedPutUrl;
        } catch (error) {
            throw new Error(`Failed to get presigned PUT URL: ${error.message}`);
        }
    }
}