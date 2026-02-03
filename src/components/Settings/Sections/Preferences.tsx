import { UIConfigField } from '@/lib/config/types';
import { safeGetItem } from '@/lib/config/clientRegistry';
import SettingsField from '../SettingsField';

const Preferences = ({
  fields,
  values,
}: {
  fields: UIConfigField[];
  values: Record<string, any>;
}) => {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
      {fields.map((field) => (
        <SettingsField
          key={field.key}
          field={field}
          value={
            (field.scope === 'client'
              ? safeGetItem(field.key)
              : values[field.key]) ?? field.default
          }
          dataAdd="preferences"
        />
      ))}
    </div>
  );
};

export default Preferences;
