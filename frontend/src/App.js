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

const otherOrganisationId = "6fb3832e-48e3-4220-9e23-4a9b39de9b41";
const otherUserId = "1d33f679-6f4c-4912-ad2a-9e06fd11bb7b";

const keys = {
  my_organisation_my_user: `${organisationId}/${userId}`,
  my_organisation_different_user: `${organisationId}/${otherUserId}`,
  different_organisation_my_user: `${otherOrganisationId}/${userId}`,
  different_organisation_different_user: `${otherOrganisationId}/${otherUserId}`,
};

function App() {
  const [successful, setSuccessful] = useState();
  const [error, setError] = useState();
  const [type, setType] = useState("my_organisation_my_user");
  const [credentials, setCredentials] = useState();
  const [selectedFile, setSelectedFile] = useState();

  const [isFilePicked, setIsFilePicked] = useState(false);

  useEffect(() => {
    console.log({ organisationId, userId });
    fetch(
      apiUrl + `?organisationId=${organisationId}&userId=${userId}`
    )
      .then((res) => res.json())
      .then((res) => {
        setCredentials(res.credentials);
      });
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
        <div>
          <input
            type="radio"
            value="my_organisation_my_user"
            name="my_organisation_my_user"
            checked={type === "my_organisation_my_user"}
            onChange={() => setType("my_organisation_my_user")}
          />
          My Organisation / My User
          <input
            type="radio"
            value="my_organisation_different_user"
            name="my_organisation_different_user"
            checked={type === "my_organisation_different_user"}
            onChange={() => setType("my_organisation_different_user")}
          />
          My Organisation / Different User
          <input
            type="radio"
            value="different_organisation_my_user"
            name="different_organisation_my_user"
            checked={type === "different_organisation_my_user"}
            onChange={() => setType("different_organisation_my_user")}
          />
          Different Organisation / My User
          <input
            type="radio"
            value="different_organisation_different_user"
            name="different_organisation_different_user"
            checked={type === "different_organisation_different_user"}
            onChange={() => setType("different_organisation_different_user")}
          />
          Different Organisation / Different User
        </div>
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
      Key: `${keys[type]}/${selectedFile.name}`,
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

export default App;
