'use client';

import React, { useState } from 'react';
import { PromptNode, InputModality, OutputModality } from '../../types';
import { Button, Input, Textarea } from '../ui';
import { storeImage } from '@/lib/images';

interface CreateNodeDialogProps {
  parentId: string | null;
  parentTag?: string;
  workspaceId: string;
  onClose: () => void;
  onSubmit: (nodeData: Omit<PromptNode, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

// Pure helper function to calculate initial version tag
function getInitialVersionTag(parentTag?: string): string {
  if (!parentTag) return 'v1.0';
  
  // Attempt to increment parent version (e.g. "v1.1" -> "v1.2")
  const regex = /v?(\d+)\.(\d+)/i;
  const match = parentTag.match(regex);
  if (match) {
    const major = match[1];
    const minor = parseInt(match[2]) + 1;
    return `v${major}.${minor}`;
  }
  return `${parentTag}-child`;
}

export const CreateNodeDialog: React.FC<CreateNodeDialogProps> = ({
  parentId,
  parentTag,
  workspaceId,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [versionTag, setVersionTag] = useState(() => getInitialVersionTag(parentTag));
  const [commitMessage, setCommitMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [inputModality, setInputModality] = useState<InputModality>('text');
  const [outputModality, setOutputModality] = useState<OutputModality>('text');
  const [promptText, setPromptText] = useState('');
  const [promptImage, setPromptImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPromptImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    setIsSubmitting(true);

    try {
      let promptImageId: string | undefined = undefined;
      if (inputModality.includes('image') && promptImage) {
        promptImageId = await storeImage(promptImage);
      }

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const defaultNodeName = name.trim() || new Date().toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      onSubmit({
        workspaceId,
        parentId,
        name: defaultNodeName,
        versionTag: versionTag.trim() || 'v1.0',
        commitMessage: commitMessage.trim(),
        notes: notes.trim() || undefined,
        isFavorite: false,
        tags,
        inputModality,
        outputModality,
        promptText: inputModality.includes('text') ? promptText : undefined,
        promptImageId,
      });
    } catch (err) {
      console.error('Error creating prompt node:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          {parentId ? 'Create New Revision' : 'Create Root Prompt Node'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Version Tag
            </label>
            <Input
              type="text"
              placeholder="e.g. v1.1"
              value={versionTag}
              onChange={(e) => setVersionTag(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Node Name (Optional)
            </label>
            <Input
              type="text"
              placeholder="Defaults to creation timestamp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Commit Message (Immutable)
            </label>
            <Input
              type="text"
              placeholder="Why was this version created?"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Input Modality
              </label>
              <select
                value={inputModality}
                onChange={(e) => setInputModality(e.target.value as InputModality)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="text">Text Only</option>
                <option value="image">Image Only</option>
                <option value="text+image">Text + Image</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Output Modality
              </label>
              <select
                value={outputModality}
                onChange={(e) => setOutputModality(e.target.value as OutputModality)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="text">Text Only</option>
                <option value="image">Image Only</option>
                <option value="text+image">Text + Image</option>
              </select>
            </div>
          </div>

          {inputModality.includes('text') && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Prompt Text
              </label>
              <Textarea
                placeholder="Enter prompt content..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          {inputModality.includes('image') && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Prompt Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
                disabled={isSubmitting}
                className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700 cursor-pointer"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Notes (Optional)
            </label>
            <Textarea
              placeholder="Observations, lessons, details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Tags (Comma separated)
            </label>
            <Input
              type="text"
              placeholder="e.g. experiment, main, tone-v2"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Node'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
