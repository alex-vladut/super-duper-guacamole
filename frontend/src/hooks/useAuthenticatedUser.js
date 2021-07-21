import { createContext, useContext } from "react";

const organisationId = "b6effee0-ce0b-4410-b270-ac8803446f50";
const userId = "4cc44c46-b209-4d08-b21a-ba11b728db0a";

const Context = createContext({
  organisationId,
  userId,
});

export function AuthenticatedUserProvider({ children }) {
  return (
    <Context.Provider value={{ organisationId, userId }}>
      {children}
    </Context.Provider>
  );
}

export function useAuthenticatedUser() {
  return useContext(Context);
}
