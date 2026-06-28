'use client';

import React, { useState } from 'react';
import { WorkspaceSnapshot } from '../../types';
import { Button } from '../ui';
import { useAppStore } from '../../store/useAppStore';
import { dbWorkspaces, dbPromptNodes, dbGenerations, dbAssets } from '../../lib/db';
import { SNAPSHOT_SCHEMA_VERSION } from '../../lib/constants';
import { base64ToBlob } from '../../lib/snapshot';

interface ImportDialogProps {
  onClose: () => void;
  onImportSuccess: (workspaceId: string) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  onClose,
  onImportSuccess,
}) => {
  const hydrateStore = useAppStore((state) => state.hydrateStore);
  const dbAvailable = useAppStore((state) => state.dbAvailable);

  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSnapshot(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as WorkspaceSnapshot;
        
        // Validation checks
        if (!parsed.schemaVersion || !parsed.workspace || !parsed.promptNodes || !parsed.generations) {
          setErrorMsg('Invalid file format. Missing core PromptFlow fields.');
          return;
        }

        if (parsed.schemaVersion > SNAPSHOT_SCHEMA_VERSION) {
          setErrorMsg(`Schema version conflict. Snapshot is version ${parsed.schemaVersion}, but app supports version ${SNAPSHOT_SCHEMA_VERSION}.`);
          return;
        }

        setSnapshot(parsed);
      } catch (err) {
        console.error('Failed to parse snapshot JSON file:', err);
        setErrorMsg('Malformed JSON file. Failed to parse.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!snapshot || !dbAvailable) return;
    setIsImporting(true);
    setErrorMsg(null);

    try {
      // 1. UUID Collision Check
      const existingWorkspace = await dbWorkspaces.getItem(snapshot.workspace.id);
      if (existingWorkspace) {
        setErrorMsg(`UUID collision detected. Workspace "${snapshot.workspace.name}" already exists on this machine.`);
        setIsImporting(false);
        return;
      }

      // 2. Write Workspace
      await dbWorkspaces.setItem(snapshot.workspace.id, snapshot.workspace);

      // 3. Write Nodes
      for (const node of snapshot.promptNodes) {
        await dbPromptNodes.setItem(node.id, node);
      }

      // 4. Write Generations
      for (const gen of snapshot.generations) {
        await dbGenerations.setItem(gen.id, gen);
      }

      // 5. Decode and write assets (if present)
      if (snapshot.exportMode === 'full' && snapshot.assets) {
        for (const [key, base64Data] of Object.entries(snapshot.assets)) {
          try {
            const blob = base64ToBlob(base64Data);
            await dbAssets.setItem(key, blob);
          } catch (assetErr) {
            console.error(`Failed to decode image asset keys ${key}:`, assetErr);
          }
        }
      }

      // 6. Reload App Zustand State
      await hydrateStore();
      
      onImportSuccess(snapshot.workspace.id);
      onClose();
    } catch (e) {
      console.error('Import process failed:', e);
      setErrorMsg('Critical failure occurred during import transaction.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Import Workspace Snapshot
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Select Snapshot JSON File
            </label>
            <input
              type="file"
              accept=".json,.promptflow.json"
              onChange={handleFileChange}
              disabled={isImporting}
              className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="rounded-lg bg-rose-50 p-3 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30">
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                {errorMsg}
              </p>
            </div>
          )}

          {/* Preview details */}
          {snapshot && (
            <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 space-y-2.5 text-xs">
              <span className="font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                Snapshot Preview Info
              </span>
              <div className="grid grid-cols-2 gap-2 text-zinc-700 dark:text-zinc-300">
                <div>
                  <span className="text-zinc-400">Name:</span> <span className="font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.workspace.name}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Format Mode:</span> <span className="font-semibold uppercase">{snapshot.exportMode}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Prompt Nodes:</span> <span className="font-semibold">{snapshot.promptNodes.length}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Generations:</span> <span className="font-semibold">{snapshot.generations.length}</span>
                </div>
              </div>
              {snapshot.exportMode === 'text-only' && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
                  ⚠️ Note: This is a text-only snapshot. Prompt/output image slots will display as unavailable.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="ghost" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={!snapshot || isImporting}>
            {isImporting ? 'Importing...' : 'Perform Import'}
          </Button>
        </div>
      </div>
    </div>
  );
};
