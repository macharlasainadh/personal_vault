/**
 * Authentication Module
 * WHY: We need an OAuth 2.0 access token to interact with the Google Drive API.
 * We strictly use Google Identity Services (GIS) and request ONLY the drive.appdata scope.
 */

// Replace this with the actual client ID provided by the user in the .env file.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

declare var google: any;

let tokenClient: any = null;
let accessToken: string | null = null;

/**
 * Initializes the Google Identity Services token client.
 */
export function initAuth(onToken: (token: string) => void, onError: (err: any) => void) {
  if (typeof google === 'undefined' || !google?.accounts?.oauth2) {
    console.error("Google Identity Services script not loaded.");
    return;
  }

  if (!CLIENT_ID) {
    console.error("VITE_GOOGLE_CLIENT_ID is not defined.");
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.error) {
        onError(response);
        return;
      }
      accessToken = response.access_token;
      if (accessToken) {
        onToken(accessToken);
      }
    },
  });
}

/**
 * Prompts the user to authorize the application.
 */
export function requestDriveAccess() {
  if (!tokenClient) {
    throw new Error("Auth client not initialized.");
  }
  // Prompts the user to select an account and grant permissions
  tokenClient.requestAccessToken();
}

/**
 * Returns the currently cached access token.
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Clears the access token from memory.
 * WHY: Ensure that tokens are securely wiped when the vault is locked.
 */
export function clearAccessToken() {
  accessToken = null;
}
