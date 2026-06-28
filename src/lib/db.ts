import localforage from 'localforage';

// Create separate localforage instances for namespaced storage
export const dbWorkspaces = localforage.createInstance({
  name: 'promptflow',
  storeName: 'workspaces',
});

export const dbPromptNodes = localforage.createInstance({
  name: 'promptflow',
  storeName: 'promptnodes',
});

export const dbGenerations = localforage.createInstance({
  name: 'promptflow',
  storeName: 'generations',
});

export const dbAssets = localforage.createInstance({
  name: 'promptflow',
  storeName: 'assets',
});

export const dbSettings = localforage.createInstance({
  name: 'promptflow',
  storeName: 'settings',
});

// Setup function to check DB availability
export async function checkDatabaseAvailability(): Promise<boolean> {
  try {
    await dbSettings.setItem('availability_test', true);
    await dbSettings.removeItem('availability_test');
    return true;
  } catch (e) {
    console.error('IndexedDB availability test failed:', e);
    return false;
  }
}
