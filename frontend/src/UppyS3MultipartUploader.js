import { useEffect, useRef, useState } from "react";
import Uppy from "@uppy/core";
import { Dashboard, useUppy } from "@uppy/react";
import ImageEditor from "@uppy/image-editor";
import Webcam from "@uppy/webcam";
import ScreenCapture from "@uppy/screen-capture";
import UppyImageCompressor from "uppy-plugin-image-compressor";
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

  const uppy = useUppy(
    () =>
      new Uppy({
        restrictions: {
          maxFileSize: 100000000, // 100MB
          allowedFileTypes: ["image/*", "application/pdf"],
        },
      })
        .use(ImageEditor, {})
        .use(Webcam, {})
        .use(ScreenCapture, {})
        // not sure this is really that useful. see https://github.com/arturi/uppy-plugin-image-compressor
        // maybe best to start without it and only add if you notice any issues
        .use(UppyImageCompressor, {}),
    []
  );

  const thumbnailGeneratedEventRef = useRef();
  const uploadSuccessEventRef = useRef();

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

    if (thumbnailGeneratedEventRef.current) {
      uppy.off("thumbnail:generated", thumbnailGeneratedEventRef.current);
    }
    thumbnailGeneratedEventRef.current = async (file, preview) => {
      const blobFile = await fetch(preview).then((r) => r.blob());

      const thumbnail = new File([blobFile], `${file.name}_thumbnail.jpg`, {
        lastModified: new Date(),
        type: "image/jpg", // Thumbnail generate is image/jpg by default. could be changed to image/png if you want to have transparent background
      });

      uppy.setFileMeta(file.id, { thumbnail });
    };
    uppy.on("thumbnail:generated", thumbnailGeneratedEventRef.current);

    if (uploadSuccessEventRef.current) {
      uppy.off("upload-success", uploadSuccessEventRef.current);
    }
    uploadSuccessEventRef.current = async (file) => {
      if (!file.meta.thumbnail) return;
      const body = await file.meta.thumbnail.arrayBuffer();
      await executeUploadThumbnail({
        bucket,
        key: `${prefix}/${file.meta.thumbnail.name}`,
        contentType: file.meta.thumbnail.type,
        body,
      });
    };
    uppy.on("upload-success", uploadSuccessEventRef.current);
  }, [
    uppy,
    prefix,
    executeCreateMultipartUpload,
    executeListParts,
    executePrepareUploadPart,
    executeAbortMultipartUpload,
    executeCompleteMultipartUpload,
    executeUploadThumbnail,
  ]);

  return (
    <div>
      <PrefixSelect onChange={setPrefix} />
      <Dashboard
        uppy={uppy}
        proudlyDisplayPoweredByUppy={false}
        plugins={[
          Webcam.name,
          ScreenCapture.name,
          ImageEditor.name,
          UppyImageCompressor.name,
        ]}
        metaFields={[{ id: "name", name: "Name", placeholder: "File name" }]}
      />
    </div>
  );
}
