import { useMemo } from "react";
import {
  S3Client,
  CreateMultipartUploadCommand,
  ListMultipartUploadsCommand,
  UploadPartCommand,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { useAwsCredentials } from "./useAwsCredentials";

export function useUploadMultipart({ region }) {
  const credentials = useAwsCredentials();

  const client = useMemo(
    () =>
      credentials &&
      new S3Client({
        credentials: {
          accessKeyId: credentials.AccessKeyId,
          secretAccessKey: credentials.SecretAccessKey,
          sessionToken: credentials.SessionToken,
          expiration: credentials.Expiration,
        },
        region,
      }),
    [credentials, region]
  );

  return {
    executeCreateMultipartUpload,
    executeListParts,
    executePrepareUploadPart,
    executeAbortMultipartUpload,
    executeCompleteMultipartUpload,
    executeUploadThumbnail,
  };

  async function executeCreateMultipartUpload({ bucket, key, contentType }) {
    const response = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      })
    );

    return {
      uploadId: response.UploadId,
      key: response.Key,
    };
  }

  async function executeListParts({ bucket, key, uploadId }) {
    // TODO: for some reason the SDK doesn't seem to allow to query the list of parts for a given UploadId
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/listmultipartuploadscommandinput.html#prefix
    const response = await client.send(
      new ListMultipartUploadsCommand({
        Bucket: bucket,
        Prefix: key,
      })
    );
    console.log(response);

    return [];
  }

  async function executePrepareUploadPart({
    bucket,
    key,
    uploadId,
    partNumber,
  }) {
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    const url = await getSignedUrl(client, command, {
      expiresIn: 3600,
    });
    return { url, headers: {} };
  }

  async function executeAbortMultipartUpload({ bucket, key, uploadId }) {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    });
    return client.send(command);
  }

  async function executeCompleteMultipartUpload({
    bucket,
    key,
    uploadId,
    parts,
  }) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });
    const response = await client.send(command);
    return { location: response.Location };
  }

  async function executeUploadThumbnail({ bucket, key, contentType, body }) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Body: body,
    });
    return client.send(command);
  }
}
