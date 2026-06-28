import { dbAssets } from './db';

/**
 * Stores an image File as a Blob in localForage under a unique UUID key.
 * Returns the key string.
 */
export async function storeImage(file: File | Blob): Promise<string> {
  const id = crypto.randomUUID();
  await dbAssets.setItem(id, file);
  return id;
}

/**
 * Retrieves an image Blob from localForage assets store.
 */
export async function getImage(key: string): Promise<Blob | null> {
  try {
    return await dbAssets.getItem<Blob>(key);
  } catch (e) {
    console.error(`Failed to retrieve image asset ${key}:`, e);
    return null;
  }
}

/**
 * Deletes an image Blob from localForage assets store.
 */
export async function deleteImage(key: string): Promise<void> {
  try {
    await dbAssets.removeItem(key);
  } catch (e) {
    console.error(`Failed to delete image asset ${key}:`, e);
  }
}
