'use client';

import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui';
import { RetentionDays, RETENTION_DAYS_OPTIONS } from '../../lib/constants';

interface SettingsDialogProps {
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const recycleBinRetentionDays = useAppStore((state) => state.recycleBinRetentionDays);
  const setRetentionDays = useAppStore((state) => state.setRetentionDays);
  const promptNodes = useAppStore((state) => state.promptNodes);
  const generations = useAppStore((state) => state.generations);

  // Passive metrics calculation
  const totalNodesCount = Object.values(promptNodes).filter(n => !n.deletedAt).length;
  const queuedGenerationsCount = Object.values(generations).filter(
    g => g.output.status === 'Queued' && !g.deletedAt
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Application Settings
        </h3>

        <div className="space-y-5">
          {/* Retention Configuration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Recycle Bin Retention Period
            </label>
            <select
              value={recycleBinRetentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value) as RetentionDays)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {RETENTION_DAYS_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} Days
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
              Soft-deleted prompt trees and trial generations will be permanently cleaned up after this window.
            </p>
          </div>

          {/* Passive Reminders */}
          <div className="rounded-lg bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
            <span className="font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
              Workspace Overview Stats
            </span>
            <div className="flex justify-between">
              <span>Total Active Nodes:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalNodesCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Queued Generations:</span>
              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                queuedGenerationsCount > 0 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400' 
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400'
              }`}>
                {queuedGenerationsCount} active reminders
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
