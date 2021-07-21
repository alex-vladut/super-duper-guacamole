import { useEffect, useMemo, useState } from "react";
import { useAuthenticatedUser } from "./hooks/useAuthenticatedUser";

const otherOrganisationId = "6fb3832e-48e3-4220-9e23-4a9b39de9b41";
const otherUserId = "1d33f679-6f4c-4912-ad2a-9e06fd11bb7b";

export function PrefixSelect({ onChange }) {
  const { organisationId, userId } = useAuthenticatedUser();
  const [type, setType] = useState("my_organisation_my_user");

  const keys = useMemo(
    () => ({
      my_organisation_my_user: `${organisationId}/${userId}`,
      my_organisation_different_user: `${organisationId}/${otherUserId}`,
      different_organisation_my_user: `${otherOrganisationId}/${userId}`,
      different_organisation_different_user: `${otherOrganisationId}/${otherUserId}`,
    }),
    [organisationId, userId]
  );

  useEffect(() => {
    onChange(keys[type]);
  }, [type, onChange, keys]);

  return (
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
  );
}
