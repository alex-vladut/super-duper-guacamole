import { UppyS3MultipartUploader } from "./UppyS3MultipartUploader";

import { AuthenticatedUserProvider } from "./hooks/useAuthenticatedUser";
import { AwsCredentialsProvider } from "./hooks/useAwsCredentials";

import config from "./exports.json";
const apiUrl = config.CdkInfraStack.ApiUrl;

function App() {
  return (
    <AuthenticatedUserProvider>
      <AwsCredentialsProvider apiUrl={apiUrl}>
        <UppyS3MultipartUploader />
      </AwsCredentialsProvider>
    </AuthenticatedUserProvider>
  );
}

export default App;
