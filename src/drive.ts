import { getAccessToken } from "./auth";

/**
 * Google Drive API Module
 */

const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_API_URL = "https://www.googleapis.com/upload/drive/v3/files";

export class AuthError extends Error {
  constructor(message?: string) {
    super(message || "Unauthorized (401). Please re-authorize Google Drive.");
    this.name = "AuthError";
  }
}

interface DriveFile {
  id: string;
  name: string;
}

function getHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new AuthError("Not authorized. Access token is missing.");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleDriveError(res: Response, fallbackMsg: string) {
  if (res.status === 401) throw new AuthError();
  if (res.status === 403) {
    try {
      const errData = await res.json();
      const reason = errData.error?.errors?.[0]?.reason;
      if (reason === "quotaExceeded") {
        throw new Error("Google Drive quota exceeded. Not enough space.");
      } else if (reason === "insufficientFilePermissions" || reason === "appNotAuthorizedToFile") {
        throw new Error("Drive permissions revoked or insufficient access.");
      }
    } catch (e) {
      // Ignore json parse error and throw fallback
    }
  }
  throw new Error(`${fallbackMsg}: ${res.statusText}`);
}

/**
 * Searches the appDataFolder for our vault files.
 */
export async function getVaultFiles(signal?: AbortSignal): Promise<{ metadataId?: string; vaultId?: string }> {
  const query = encodeURIComponent("name='metadata.json' or name='vault.enc'");
  const url = `${DRIVE_API_URL}?spaces=appDataFolder&q=${query}&fields=files(id,name)`;
  
  const res = await fetch(url, { headers: getHeaders(), signal });
  if (!res.ok) await handleDriveError(res, "Failed to list files");

  const data = await res.json();
  const files: DriveFile[] = data.files || [];

  const metadataFiles = files.filter(f => f.name === "metadata.json");
  const vaultFiles = files.filter(f => f.name === "vault.enc");

  if (metadataFiles.length > 1) {
    throw new Error("Vault corruption: Multiple metadata.json files found in Drive.");
  }
  if (vaultFiles.length > 1) {
    throw new Error("Vault corruption: Multiple vault.enc files found in Drive.");
  }

  return { 
    metadataId: metadataFiles[0]?.id, 
    vaultId: vaultFiles[0]?.id 
  };
}

/**
 * Downloads a file's content from Drive.
 */
export async function downloadFile(fileId: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
    headers: getHeaders(),
    signal
  });
  if (!res.ok) await handleDriveError(res, `Failed to download file ${fileId}`);
  return res.text();
}

/**
 * Creates a new file in appDataFolder, then uploads its content.
 */
export async function createFile(name: string, content: string, signal?: AbortSignal): Promise<string> {
  const metaRes = await fetch(DRIVE_API_URL, {
    method: "POST",
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      parents: ["appDataFolder"],
    }),
    signal
  });

  if (!metaRes.ok) await handleDriveError(metaRes, `Failed to create file metadata for ${name}`);

  const fileMeta = await metaRes.json();
  const fileId = fileMeta.id;

  await updateFile(fileId, content, signal);

  return fileId;
}

/**
 * Updates an existing file's content using PATCH.
 */
export async function updateFile(fileId: string, content: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${UPLOAD_API_URL}/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
    body: content,
    signal
  });

  if (!res.ok) await handleDriveError(res, `Failed to update file ${fileId}`);
}

/**
 * Fetches authenticated user's profile info (name, email, photo) from Drive about.get
 * Uses the EXISTING drive.appdata token without requesting any broad Drive permissions.
 */
export async function getUserProfile(signal?: AbortSignal): Promise<import('./types').UserProfile> {
  try {
    const url = "https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress,photoLink)";
    const res = await fetch(url, { headers: getHeaders(), signal });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      name: data.user?.displayName,
      email: data.user?.emailAddress,
      photoUrl: data.user?.photoLink,
    };
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn("Could not retrieve user profile:", err);
    }
    return {};
  }
}
