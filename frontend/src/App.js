import { UppyS3Uploader } from "./UppyS3Uploader";

import { AuthenticatedUserProvider } from "./hooks/useAuthenticatedUser";
import { AwsCredentialsProvider } from "./hooks/useAwsCredentials";

import config from "./exports.json";
const apiUrl = config.CdkInfraStack.ApiUrl;

function App() {
  return (
    <AuthenticatedUserProvider>
      <AwsCredentialsProvider apiUrl={apiUrl}>
        <UppyS3Uploader />
      </AwsCredentialsProvider>
    </AuthenticatedUserProvider>
  );
}

export default App;
