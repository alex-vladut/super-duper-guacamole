import { useEffect, useRef, useState } from "react";
import Uppy from "@uppy/core";
import { Dashboard, useUppy } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";

import { PrefixSelect } from "./PrefixSelect";
import { useCreateUploadSignedUrl } from "./hooks/useCreateUploadSignedUrl";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

import config from "./exports.json";

const bucket = config.CdkInfraStack.BucketName;
const region = config.CdkInfraStack.Region;

export function UppyS3Uploader(props) {
  const [prefix, setPrefix] = useState();

  const executeCreateUploadSignedUrl = useCreateUploadSignedUrl({ region });

  const prefixRef = useRef(prefix);
  const executeCreateUploadSignedUrlRef = useRef(executeCreateUploadSignedUrl);

  useEffect(() => {
    prefixRef.current = prefix;
  }, [prefix]);

  useEffect(() => {
    executeCreateUploadSignedUrlRef.current = executeCreateUploadSignedUrl;
  }, [executeCreateUploadSignedUrl]);

  const uppy = useUppy(
    () =>
      new Uppy().use(AwsS3, {
        metaFields: ["name"],
        getUploadParameters,
      }),
    []
  );

  return (
    <div>
      <PrefixSelect onChange={setPrefix} />
      <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} />
    </div>
  );

  async function getUploadParameters(file) {
    const url = await executeCreateUploadSignedUrlRef.current({
      bucket,
      key: `${prefixRef.current}/${file.name}`,
      contentType: file.type,
    });
    return {
      method: "PUT",
      url,
      fields: [],
      headers: {
        "content-type": file.type,
      },
    };
  }
}
