import { useState } from "react";
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

let self;

export function UppyS3Uploader(props) {
  const [prefix, setPrefix] = useState();

  const executeCreateUploadSignedUrl = useCreateUploadSignedUrl({ region });

  // TODO: Uppy binds the methods passed to it to an internal "this" so it cannot access the variables defined here anymore
  // maybe there is a better way to overcome this issue
  self = { prefix, executeCreateUploadSignedUrl };

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
    const url = await self.executeCreateUploadSignedUrl({
      bucket,
      key: `${self.prefix}/${file.name}`,
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
