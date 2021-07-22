import { useEffect, useRef, useState } from "react";
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
    executeUploadThumbnail,
  } = useUploadMultipart({ region });

  const prefixRef = useRef(prefix);
  const executeUploadThumbnailRef = useRef(executeUploadThumbnail);

  // This is necessary because Uppy is binding the event listeners to some other "this"
  // and as a result it doesn't have access to the component's current state (it only references the initial instance of executeUploadThumbnail in which the S3 client may not have yet been initialised)
  useEffect(() => {
    executeUploadThumbnailRef.current = executeUploadThumbnail;
  }, [executeUploadThumbnail]);

  useEffect(() => {
    prefixRef.current = prefix;
  }, [prefix]);

  const uppy = useUppy(() => {
    const result = new Uppy({
      restrictions: {
        maxFileSize: 100000000, // 100MB
        allowedFileTypes: ["image/*", "application/pdf"],
      },
    });
    result.on("thumbnail:generated", async (file, preview) => {
      const blobFile = await fetch(preview).then((r) => r.blob());

      const thumbnail = new File([blobFile], `${file.name}_thumbnail.jpg`, {
        lastModified: new Date(),
        type: "image/jpg", // Thumbnail generate is image/jpg by default. could be changed to image/png if you want to have transparent background
      });

      result.setFileMeta(file.id, { thumbnail });
    });
    result.on("upload-success", async (file) => {
      if (!file.meta.thumbnail) return;
      console.log(file.meta.thumbnail);

      const body = await file.meta.thumbnail.arrayBuffer();
      await executeUploadThumbnailRef.current({
        bucket,
        key: `${prefixRef.current}/${file.meta.thumbnail.name}`,
        contentType: file.meta.thumbnail.type,
        body,
      });
    });
    return result;
  }, []);

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
      <Dashboard
        uppy={uppy}
        proudlyDisplayPoweredByUppy={false}
        plugins={["ImageEditor"]}
        metaFields={[{ id: "name", name: "Name", placeholder: "File name" }]}
      />
    </div>
  );
}
