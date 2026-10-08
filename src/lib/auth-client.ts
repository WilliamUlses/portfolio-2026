import { passkeyClient } from "@better-auth/passkey/client";
import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Better Auth client for admin interface, enabling two-factor and passkey authentication.
export const authClient = createAuthClient({
  plugins: [twoFactorClient(), passkeyClient()],
});
