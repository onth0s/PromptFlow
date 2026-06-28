'use client';

import React from 'react';
import { Button } from '../ui';

interface DeleteConfirmDialogProps {
  nodeName: string;
  nodeTag: string;
  descendantsCount: number;
  generationsCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  nodeName,
  nodeTag,
  descendantsCount,
  generationsCount,
  onClose,
  onConfirm,
}) => {
  const hasDescendants = descendantsCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Confirm Soft Delete
        </h3>
        
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">{nodeTag} ({nodeName})</span>?
            This will mark it as soft-deleted and move it to the Recycle Bin.
          </p>

          {hasDescendants && (
            <div className="rounded-lg bg-rose-50 p-3.5 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30">
              <span className="font-bold text-rose-800 dark:text-rose-400 block text-xs uppercase tracking-wider mb-1">
                Cascading Delete Warnings
              </span>
              <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                This node is the parent of <span className="font-bold">{descendantsCount} descendant {descendantsCount === 1 ? 'node' : 'nodes'}</span>. 
                Deleting it will also soft-delete the entire branch hierarchy and all associated <span className="font-bold">{generationsCount} {generationsCount === 1 ? 'generation' : 'generations'}</span>.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
};
