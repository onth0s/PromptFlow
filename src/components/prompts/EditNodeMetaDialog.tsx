'use client';

import React, { useState } from 'react';
import { PromptNodeWithChildren } from '../../types';
import { Button, Input, Textarea } from '../ui';

interface EditNodeMetaDialogProps {
  node: PromptNodeWithChildren;
  onClose: () => void;
  onSubmit: (updates: Partial<Pick<PromptNodeWithChildren, 'name' | 'versionTag' | 'notes' | 'tags'>>) => void;
}

export const EditNodeMetaDialog: React.FC<EditNodeMetaDialogProps> = ({
  node,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(node.name);
  const [versionTag, setVersionTag] = useState(node.versionTag);
  const [notes, setNotes] = useState(node.notes || '');
  const [tagsInput, setTagsInput] = useState(node.tags.join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSubmit({
      name: name.trim() || node.name,
      versionTag: versionTag.trim() || node.versionTag,
      notes: notes.trim() || undefined,
      tags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Edit Presentation Fields
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Version Tag
            </label>
            <Input
              type="text"
              value={versionTag}
              onChange={(e) => setVersionTag(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Node Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Notes (Mutable)
            </label>
            <Textarea
              placeholder="Evolving commentary, lessons..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Tags (Comma separated)
            </label>
            <Input
              type="text"
              placeholder="e.g. baseline, main, tone-v2"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Readonly Context Display */}
          <div className="rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div>
              <span className="font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider text-[10px]">
                Commit Message (Immutable)
              </span>
              <p className="text-zinc-700 dark:text-zinc-300 italic mt-0.5">&ldquo;{node.commitMessage}&rdquo;</p>
            </div>
            {node.promptText && (
              <div>
                <span className="font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider text-[10px]">
                  Prompt Text (Immutable)
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 line-clamp-3 whitespace-pre-wrap mt-0.5">{node.promptText}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
