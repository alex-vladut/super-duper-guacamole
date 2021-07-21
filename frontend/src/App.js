import { SimpleUploader } from "./SimpleUploader";

import { AuthenticatedUserProvider } from "./hooks/useAuthenticatedUser";
import { AwsCredentialsProvider } from "./hooks/useAwsCredentials";

import config from "./exports.json";
const apiUrl = config.CdkInfraStack.ApiUrl;

function App() {
  return (
    <AuthenticatedUserProvider>
      <AwsCredentialsProvider apiUrl={apiUrl}>
        <SimpleUploader />
      </AwsCredentialsProvider>
    </AuthenticatedUserProvider>
  );
}

export default App;
