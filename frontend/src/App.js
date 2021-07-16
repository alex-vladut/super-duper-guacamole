import { useEffect, useState } from "react";
import "./App.css";

//https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import config from "./exports.json";

const apiUrl = config.CdkInfraStack.ApiUrl;
const bucketName = config.CdkInfraStack.BucketName;
const region = config.CdkInfraStack.Region;

const organisationId = "b6effee0-ce0b-4410-b270-ac8803446f50";
const userId = "4cc44c46-b209-4d08-b21a-ba11b728db0a";

function App() {
  const [credentials, setCredentials] = useState();
  const [selectedFile, setSelectedFile] = useState();

  const [isFilePicked, setIsFilePicked] = useState(false);

  useEffect(() => {
    fetch(apiUrl + `?organisationId=${organisationId}&userId=${userId}`)
      .then((res) => res.json())
      .then((res) => setCredentials(res.credentials));
  }, []);

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
        <button onClick={handleSubmission}>Upload</button>
      </div>
    </div>
  );

  function changeHandler(event) {
    setSelectedFile(event.target.files[0]);

    setIsFilePicked(true);
  }

  async function handleSubmission() {
    if (!selectedFile) return;

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
      Key: `${organisationId}/${userId}/${selectedFile.name}`,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    console.log(url);
  }
}

export default App;
