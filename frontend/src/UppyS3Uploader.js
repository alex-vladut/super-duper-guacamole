import { useEffect, useState } from "react";
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

  const uppy = useUppy(() => new Uppy(), []);

  useEffect(() => {
    const plugin = uppy.getPlugin(AwsS3.name);
    if (plugin) {
      uppy.removePlugin(plugin);
    }

    uppy.use(AwsS3, {
      metaFields: ["name"],
      async getUploadParameters(file) {
        const url = await executeCreateUploadSignedUrl({
          bucket,
          key: `${prefix}/${file.name}`,
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
      },
    });
  }, [uppy, prefix, executeCreateUploadSignedUrl]);

  return (
    <div>
      <PrefixSelect onChange={setPrefix} />
      <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} />
    </div>
  );
}
