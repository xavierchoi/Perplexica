import Select from '@/components/ui/Select';
import { ConfigModelProvider } from '@/lib/config/types';
import { useMemo } from 'react';

interface SelectedModel {
  providerId: string;
  key: string;
}

interface ModelSelectProps {
  providers: ConfigModelProvider[];
  type: 'chat' | 'embedding';
  value: SelectedModel | null;
  onChange: (value: SelectedModel) => void;
}

const ModelSelect = ({ providers, type, value, onChange }: ModelSelectProps) => {
  // Convert current selection to string format for Select component
  const selectedModel = useMemo(() => {
    if (value?.providerId && value?.key) {
      return `${value.providerId}/${value.key}`;
    }
    return '';
  }, [value]);

  // Handle selection change (local state only, no server save)
  const handleChange = (newValue: string) => {
    const providerId = newValue.split('/')[0];
    const modelKey = newValue.split('/').slice(1).join('/');
    onChange({ providerId, key: modelKey });
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
          onChange={(event) => handleChange(event.target.value)}
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
        />
      </div>
    </section>
  );
};

export default ModelSelect;
