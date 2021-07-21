import { createContext, useContext, useEffect, useState } from "react";

import { useAuthenticatedUser } from "./useAuthenticatedUser";

const Context = createContext();

export function AwsCredentialsProvider({ apiUrl, children }) {
  const [credentials, setCredentials] = useState();
  const { organisationId, userId } = useAuthenticatedUser();

  useEffect(() => {
    if (!organisationId || !userId || !apiUrl) return;

    function updateCredentials() {
      fetch(`${apiUrl}?organisationId=${organisationId}&userId=${userId}`)
        .then((res) => res.json())
        .then((res) => setCredentials(res.credentials));
    }

    updateCredentials();

    const interval = setInterval(updateCredentials, 30000);

    return () => clearInterval(interval);
  }, [organisationId, userId, apiUrl]);

  return <Context.Provider value={credentials}>{children}</Context.Provider>;
}

export function useAwsCredentials() {
  return useContext(Context);
}
