import Select from '@/components/ui/Select';
import { ConfigModelProvider } from '@/lib/config/types';
import { useChat } from '@/lib/hooks/useChat';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

const ModelSelect = ({
  providers,
  type,
}: {
  providers: ConfigModelProvider[];
  type: 'chat' | 'embedding';
}) => {
  const [loading, setLoading] = useState(false);
  const {
    setChatModelProvider,
    setEmbeddingModelProvider,
    chatModelProvider,
    embeddingModelProvider,
  } = useChat();

  // Get current selection from useChat context (server-backed)
  const selectedModel = useMemo(() => {
    if (type === 'chat') {
      return chatModelProvider?.providerId && chatModelProvider?.key
        ? `${chatModelProvider.providerId}/${chatModelProvider.key}`
        : '';
    } else {
      return embeddingModelProvider?.providerId && embeddingModelProvider?.key
        ? `${embeddingModelProvider.providerId}/${embeddingModelProvider.key}`
        : '';
    }
  }, [type, chatModelProvider, embeddingModelProvider]);

  const saveModelToServer = async (
    configKey: string,
    value: { providerId: string; key: string },
  ) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: configKey, value }),
    });

    if (!res.ok) {
      throw new Error('Server returned an error');
    }
  };

  const handleSave = async (newValue: string) => {
    setLoading(true);

    try {
      const providerId = newValue.split('/')[0];
      const modelKey = newValue.split('/').slice(1).join('/');
      const modelValue = { providerId, key: modelKey };

      if (type === 'chat') {
        await saveModelToServer('preferences.selectedChatModel', modelValue);
        setChatModelProvider(modelValue);
      } else {
        await saveModelToServer('preferences.selectedEmbeddingModel', modelValue);
        setEmbeddingModelProvider(modelValue);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-light-200 bg-light-primary/80 p-4 lg:p-6 transition-colors dark:border-dark-200 dark:bg-dark-primary/80">
      <div className="space-y-3 lg:space-y-5">
        <div>
          <h4 className="text-sm lg:text-sm text-black dark:text-white">
            Select {type === 'chat' ? 'Chat Model' : 'Embedding Model'}
          </h4>
          <p className="text-[11px] lg:text-xs text-black/50 dark:text-white/50">
            {type === 'chat'
              ? 'Choose which model to use for generating responses'
              : 'Choose which model to use for generating embeddings'}
          </p>
        </div>
        <Select
          value={selectedModel}
          onChange={(event) => handleSave(event.target.value)}
          options={
            type === 'chat'
              ? providers.flatMap((provider) =>
                  provider.chatModels.map((model) => ({
                    value: `${provider.id}/${model.key}`,
                    label: `${provider.name} - ${model.name}`,
                  })),
                )
              : providers.flatMap((provider) =>
                  provider.embeddingModels.map((model) => ({
                    value: `${provider.id}/${model.key}`,
                    label: `${provider.name} - ${model.name}`,
                  })),
                )
          }
          className="!text-xs lg:!text-[13px]"
          loading={loading}
          disabled={loading}
        />
      </div>
    </section>
  );
};

export default ModelSelect;
