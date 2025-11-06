import type { FeatureFlags } from '../lib/blog.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FlagsPanelProps {
  value: FeatureFlags | null | undefined;
  onChange: (flags: FeatureFlags | null) => void;
}

const defaultFlags: FeatureFlags = {
  featured: false,
  editorsPick: false,
  allowComments: true,
  heroLayout: 'classic',
};

export function FlagsPanel({ value, onChange }: FlagsPanelProps) {
  const flags = { ...defaultFlags, ...value };

  function update(partial: Partial<FeatureFlags>) {
    const next = { ...flags, ...partial };
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <ToggleRow
        label="Featured"
        description="Surface this post in featured carousels and home page sections."
        checked={flags.featured}
        onChange={(checked) => update({ featured: checked })}
      />
      <ToggleRow
        label="Editor's Pick"
        description="Highlight the post as an editorial recommendation."
        checked={flags.editorsPick}
        onChange={(checked) => update({ editorsPick: checked })}
      />
      <ToggleRow
        label="Allow Comments"
        description="Enable comments when the frontend integrates a provider."
        checked={flags.allowComments}
        onChange={(checked) => update({ allowComments: checked })}
      />
      <div className="space-y-2">
        <Label htmlFor="hero-layout">Hero Layout</Label>
        <Input
          id="hero-layout"
          value={flags.heroLayout}
          onChange={(event) => update({ heroLayout: event.target.value })}
          placeholder="classic"
        />
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-4">
      <div>
        <div className="font-medium">{label}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
