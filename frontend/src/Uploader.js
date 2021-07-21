import Uppy from "@uppy/core";
import { Dashboard, useUppy } from "@uppy/react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

export function Uploader(props) {
  const uppy = useUppy(() => new Uppy().use(AwsS3Multipart, {
      
  }));

  return <Dashboard uppy={uppy} />;
}
