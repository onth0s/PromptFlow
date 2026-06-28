'use client';

import React, { useState } from 'react';
import { GenerationStatus, GenerationOutput } from '../../types';
import { Button, Input, Textarea } from '../ui';
import { storeImage } from '@/lib/images';

interface AddGenerationDialogProps {
  nodeId: string;
  onClose: () => void;
  onSubmit: (genData: {
    promptNodeId: string;
    provider?: string;
    model?: string;
    duration?: number;
    output: GenerationOutput;
  }) => void;
}

export const AddGenerationDialog: React.FC<AddGenerationDialogProps> = ({
  nodeId,
  onClose,
  onSubmit,
}) => {
  const [status, setStatus] = useState<GenerationStatus>('Completed');
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [duration, setDuration] = useState('');
  
  // Output states
  const [outputText, setOutputText] = useState('');
  const [outputImage, setOutputImage] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOutputImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let output: GenerationOutput = { status: 'Queued' };

      if (status === 'Completed') {
        let imageId: string | undefined = undefined;
        if (outputImage) {
          imageId = await storeImage(outputImage);
        }
        output = {
          status: 'Completed',
          text: outputText.trim() || undefined,
          imageId,
        };
      } else if (status === 'Failed') {
        output = {
          status: 'Failed',
          error: errorMsg.trim() || 'Generation failed with an unknown error.',
        };
      }

      onSubmit({
        promptNodeId: nodeId,
        provider: provider.trim() || undefined,
        model: model.trim() || undefined,
        duration: duration ? parseInt(duration) : undefined,
        output,
      });
    } catch (err) {
      console.error('Error logging generation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Log Generation Trial
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as GenerationStatus)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Queued">Queued (Manual Placeholder)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Provider (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. OpenAI"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Model (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. gpt-4o"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Duration (Milliseconds, Optional)
            </label>
            <Input
              type="number"
              placeholder="e.g. 1500"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Conditional Output Fields */}
          {status === 'Completed' && (
            <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Text Output
                </label>
                <Textarea
                  placeholder="Paste generation output..."
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Image Output (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          {status === 'Failed' && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Error Message
              </label>
              <Textarea
                placeholder="e.g. API Rate limit exceeded..."
                value={errorMsg}
                onChange={(e) => setErrorMsg(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
