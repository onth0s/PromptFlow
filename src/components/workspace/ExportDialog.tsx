'use client';

import React, { useState } from 'react';
import { Workspace, PromptNode, Generation } from '../../types';
import { Button } from '../ui';
import { exportWorkspace, downloadSnapshot } from '../../lib/snapshot';

interface ExportDialogProps {
  workspace: Workspace;
  nodes: PromptNode[];
  generations: Generation[];
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  workspace,
  nodes,
  generations,
  onClose,
}) => {
  const [mode, setMode] = useState<'full' | 'text-only'>('full');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const snapshot = await exportWorkspace(workspace, nodes, generations, mode);
      downloadSnapshot(snapshot, workspace.name);
      onClose();
    } catch (e) {
      console.error('Export failed:', e);
      alert('Failed to generate export file snapshot.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Export Workspace Snapshot
        </h3>
        
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Backup or share <span className="font-semibold text-zinc-700 dark:text-zinc-300">{workspace.name}</span>. Select an export format:
        </p>

        <div className="space-y-3 mb-6">
          {/* Full Export Option */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-indigo-400 transition-colors cursor-pointer">
            <input
              type="radio"
              name="exportMode"
              checked={mode === 'full'}
              onChange={() => setMode('full')}
              className="mt-1"
              disabled={isExporting}
            />
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                Full Artifact Export (Recommended)
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5 leading-relaxed">
                Includes all text prompt trees, metrics, trial logs, and references. Base64 encodes and embeds prompt/output images. Generates larger self-contained files.
              </span>
            </div>
          </label>

          {/* Text-Only Export Option */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-indigo-400 transition-colors cursor-pointer">
            <input
              type="radio"
              name="exportMode"
              checked={mode === 'text-only'}
              onChange={() => setMode('text-only')}
              className="mt-1"
              disabled={isExporting}
            />
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                Text-Only Export
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5 leading-relaxed">
                Excludes all image binaries. References remain intact but image slots will display as unavailable when imported elsewhere. Significantly smaller file sizes.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Generating...' : 'Download (.json)'}
          </Button>
        </div>
      </div>
    </div>
  );
};
