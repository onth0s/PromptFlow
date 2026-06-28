import { WorkspaceSnapshot, Workspace, PromptNode, Generation } from '../types';
import { dbAssets } from './db';
import { SNAPSHOT_SCHEMA_VERSION } from './constants';

export async function exportWorkspace(
  workspace: Workspace,
  promptNodes: PromptNode[],
  generations: Generation[],
  mode: 'full' | 'text-only'
): Promise<WorkspaceSnapshot> {
  const snapshot: WorkspaceSnapshot = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    exportMode: mode,
    exportedAt: new Date().toISOString(),
    workspace,
    promptNodes,
    generations,
  };

  if (mode === 'full') {
    const assets: Record<string, string> = {};
    
    // Collect prompt image assets
    for (const node of promptNodes) {
      if (node.promptImageId) {
        try {
          const blob = await dbAssets.getItem<Blob>(node.promptImageId);
          if (blob) {
            assets[node.promptImageId] = await blobToBase64(blob);
          }
        } catch (e) {
          console.error(`Failed to export prompt image asset ${node.promptImageId}:`, e);
        }
      }
    }

    // Collect generation output image assets
    for (const gen of generations) {
      if (gen.output.status === 'Completed' && gen.output.imageId) {
        try {
          const blob = await dbAssets.getItem<Blob>(gen.output.imageId);
          if (blob) {
            assets[gen.output.imageId] = await blobToBase64(blob);
          }
        } catch (e) {
          console.error(`Failed to export generation image asset ${gen.output.imageId}:`, e);
        }
      }
    }

    snapshot.assets = assets;
  }

  return snapshot;
}

export function downloadSnapshot(snapshot: WorkspaceSnapshot, workspaceName: string) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${workspaceName.replace(/\s+/g, '_')}_${dateStr}.promptflow.json`;
  
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Convert File/Blob to Base64 String
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Conversion to base64 failed.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert Base64 string back to Blob
export function base64ToBlob(b64Data: string): Blob {
  const parts = b64Data.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}
