import React, { useState, useEffect, useMemo } from 'react';
import AddProvider from './AddProviderDialog';
import {
  ConfigModelProvider,
  ModelProviderUISection,
  UIConfigField,
} from '@/lib/config/types';
import ModelProvider from './ModelProvider';
import ModelSelect from './ModelSelect';
import { useChat } from '@/lib/hooks/useChat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

interface SelectedModel {
  providerId: string;
  key: string;
}

const Models = ({
  fields,
  values,
}: {
  fields: ModelProviderUISection[];
  values: ConfigModelProvider[];
}) => {
  const [providers, setProviders] = useState<ConfigModelProvider[]>(values);

  // Get current model selections from useChat context
  const {
    chatModelProvider,
    embeddingModelProvider,
    setChatModelProvider,
    setEmbeddingModelProvider,
  } = useChat();

  // Local state for model selections (before saving)
  const [localChatModel, setLocalChatModel] = useState<SelectedModel | null>(
    null,
  );
  const [localEmbeddingModel, setLocalEmbeddingModel] =
    useState<SelectedModel | null>(null);

  // Initial values for dirty checking
  const [initialChatModel, setInitialChatModel] = useState<SelectedModel | null>(
    null,
  );
  const [initialEmbeddingModel, setInitialEmbeddingModel] =
    useState<SelectedModel | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local state from useChat context
  useEffect(() => {
    if (chatModelProvider?.key && chatModelProvider?.providerId) {
      const model = {
        providerId: chatModelProvider.providerId,
        key: chatModelProvider.key,
      };
      setLocalChatModel(model);
      setInitialChatModel(model);
    }
    if (embeddingModelProvider?.key && embeddingModelProvider?.providerId) {
      const model = {
        providerId: embeddingModelProvider.providerId,
        key: embeddingModelProvider.key,
      };
      setLocalEmbeddingModel(model);
      setInitialEmbeddingModel(model);
    }
  }, [chatModelProvider, embeddingModelProvider]);

  // Check if there are unsaved changes
  const isDirty = useMemo(() => {
    const chatChanged =
      JSON.stringify(localChatModel) !== JSON.stringify(initialChatModel);
    const embeddingChanged =
      JSON.stringify(localEmbeddingModel) !==
      JSON.stringify(initialEmbeddingModel);
    return chatChanged || embeddingChanged;
  }, [
    localChatModel,
    localEmbeddingModel,
    initialChatModel,
    initialEmbeddingModel,
  ]);

  // Save models to server
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save chat model
      if (localChatModel) {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'preferences.selectedChatModel',
            value: localChatModel,
          }),
        });
        if (!res.ok) throw new Error('Failed to save chat model');
        setChatModelProvider(localChatModel);
      }

      // Save embedding model
      if (localEmbeddingModel) {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'preferences.selectedEmbeddingModel',
            value: localEmbeddingModel,
          }),
        });
        if (!res.ok) throw new Error('Failed to save embedding model');
        setEmbeddingModelProvider(localEmbeddingModel);
      }

      // Update initial values after successful save
      setInitialChatModel(localChatModel);
      setInitialEmbeddingModel(localEmbeddingModel);

      toast.success('Models saved successfully');
    } catch (error) {
      console.error('Error saving models:', error);
      toast.error('Failed to save models');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto py-6">
      <div className="flex flex-col px-6 gap-y-4">
        <h3 className="text-xs lg:text-xs text-black/70 dark:text-white/70">
          Select models
        </h3>
        <ModelSelect
          providers={values.filter((p) =>
            p.chatModels.some((m) => m.key != 'error'),
          )}
          type="chat"
          value={localChatModel}
          onChange={setLocalChatModel}
        />
        <ModelSelect
          providers={values.filter((p) =>
            p.embeddingModels.some((m) => m.key != 'error'),
          )}
          type="embedding"
          value={localEmbeddingModel}
          onChange={setLocalEmbeddingModel}
        />
        {/* Save Button */}
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'flex items-center space-x-1.5 px-4 py-2 text-sm rounded-lg transition-colors',
              isDirty && !isSaving
                ? 'bg-sky-500 text-white hover:bg-sky-600'
                : 'bg-light-200 dark:bg-dark-200 text-black/40 dark:text-white/40 cursor-not-allowed',
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="border-t border-light-200 dark:border-dark-200" />
      <div className="flex flex-row justify-between items-center px-6 ">
        <p className="text-xs lg:text-xs text-black/70 dark:text-white/70">
          Manage connections
        </p>
        <AddProvider modelProviders={fields} setProviders={setProviders} />
      </div>
      <div className="flex flex-col px-6 gap-y-4">
        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border-2 border-dashed border-light-200 dark:border-dark-200 bg-light-secondary/10 dark:bg-dark-secondary/10">
            <div className="p-3 rounded-full bg-sky-500/10 dark:bg-sky-500/10 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-sky-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-black/70 dark:text-white/70 mb-1">
              No connections yet
            </p>
            <p className="text-xs text-black/50 dark:text-white/50 text-center max-w-sm mb-4">
              Add your first connection to start using AI models. Connect to
              OpenAI, Anthropic, Ollama, and more.
            </p>
          </div>
        ) : (
          providers.map((provider) => (
            <ModelProvider
              key={`provider-${provider.id}`}
              fields={
                (fields.find((f) => f.key === provider.type)?.fields ??
                  []) as UIConfigField[]
              }
              modelProvider={provider}
              setProviders={setProviders}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Models;
