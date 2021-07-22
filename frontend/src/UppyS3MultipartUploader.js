import { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import { Dashboard, useUppy } from "@uppy/react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";

import { PrefixSelect } from "./PrefixSelect";
import { useUploadMultipart } from "./hooks/useUploadMultipart";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

import config from "./exports.json";

const bucket = config.CdkInfraStack.BucketName;
const region = config.CdkInfraStack.Region;

export function UppyS3MultipartUploader(props) {
  const [prefix, setPrefix] = useState();

  const {
    executeCreateMultipartUpload,
    executeListParts,
    executePrepareUploadPart,
    executeAbortMultipartUpload,
    executeCompleteMultipartUpload,
  } = useUploadMultipart({ region });

  const uppy = useUppy(
    () =>
      new Uppy({
        restrictions: {
          maxFileSize: 100000000, // 100MB
          allowedFileTypes: ["image/*", "application/pdf"],
        },
      }),
    []
  );

  useEffect(() => {
    const plugin = uppy.getPlugin(AwsS3Multipart.name);
    if (plugin) {
      uppy.removePlugin(plugin);
    }

    uppy.use(AwsS3Multipart, {
      getChunkSize(file) {
        // TODO: how should that be calculated for best experience???
        // the documentation doesn't even specify if it is in bytes, KB, MB??
        const partSize = 1024 * 1024 * 5; // 5MB
        const fileSize = file.size;
        const numParts = Math.ceil(fileSize / partSize);
        return numParts;
      },
      async createMultipartUpload(file) {
        return executeCreateMultipartUpload({
          bucket,
          key: `${prefix}/${file.name}`,
          contentType: file.type,
        });
      },
      async listParts(file, { uploadId, key }) {
        return executeListParts({
          bucket,
          key,
          uploadId,
        });
      },
      async prepareUploadPart(file, partData) {
        const { key, uploadId, number } = partData;
        return executePrepareUploadPart({
          bucket,
          key,
          uploadId,
          partNumber: number,
        });
      },
      async abortMultipartUpload(file, { uploadId, key }) {
        return executeAbortMultipartUpload({ bucket, key, uploadId });
      },
      async completeMultipartUpload(file, { uploadId, key, parts }) {
        return executeCompleteMultipartUpload({
          bucket,
          key,
          uploadId,
          parts,
        });
      },
    });
  }, [
    uppy,
    prefix,
    executeCreateMultipartUpload,
    executeListParts,
    executePrepareUploadPart,
    executeAbortMultipartUpload,
    executeCompleteMultipartUpload,
  ]);

  return (
    <div>
      <PrefixSelect onChange={setPrefix} />
      <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} />
    </div>
  );
}
