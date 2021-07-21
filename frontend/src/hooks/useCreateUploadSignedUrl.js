import { useMemo } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { useAwsCredentials } from "./useAwsCredentials";

export function useCreateUploadSignedUrl({ region }) {
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

  return async function createUploadSignedUrl({ bucket, key, contentType }) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(client, command, {
      expiresIn: 3600,
    });
  };
}
