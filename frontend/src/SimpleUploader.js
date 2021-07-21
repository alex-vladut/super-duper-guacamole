import { useState } from "react";
//https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import config from "./exports.json";
import { useAwsCredentials } from "./hooks/useAwsCredentials";
import { PrefixSelect } from "./PrefixSelect";

const bucketName = config.CdkInfraStack.BucketName;
const region = config.CdkInfraStack.Region;

export function SimpleUploader() {
  const credentials = useAwsCredentials();
  const [successful, setSuccessful] = useState();
  const [error, setError] = useState();
  const [prefix, setPrefix] = useState();
  const [selectedFile, setSelectedFile] = useState();
  const [isFilePicked, setIsFilePicked] = useState(false);

  return (
    <div className="App">
      <input type="file" name="file" onChange={changeHandler} />

      {isFilePicked ? (
        <div>
          <p>Filename: {selectedFile.name}</p>
          <p>Filetype: {selectedFile.type}</p>
          <p>Size in bytes: {selectedFile.size}</p>
        </div>
      ) : (
        <p>Select a file to show details</p>
      )}

      <div>
        <PrefixSelect onChange={setPrefix} />
        <button onClick={handleSubmission}>Upload</button>
        <div>{error}</div>
        <div>{successful}</div>
      </div>
    </div>
  );

  function changeHandler(event) {
    setSelectedFile(event.target.files[0]);

    setIsFilePicked(true);
  }

  async function handleSubmission() {
    if (!selectedFile) return;

    setError("");
    setSuccessful("");

    const client = new S3Client({
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
        expiration: credentials.Expiration,
      },
      region,
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${prefix}/${selectedFile.name}`,
      // Body: "hello",
    });
    // can use this method to interact directly with S3, or the next line to upload through signed URL
    // await client.send(command);

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: 3600,
    });
    const formData = new FormData();
    formData.append("Content-Type", selectedFile.type);
    formData.append("file", selectedFile); // The file has be the last element

    fetch(signedUrl, {
      method: "PUT",
      body: "helloss",
      headers: {
        "Content-Type": "text/plain",
      },
    })
      .then((res) => {
        if (res.status === 200) {
          setSuccessful("Uploaded successfully");
        } else {
          setError(`Error: ${res.status} ${res.statusText}`);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(`Error: ${err.message}`);
      });
  }
}
