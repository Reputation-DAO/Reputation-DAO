import { useMemo } from 'react';
import type { MediaAsset, SeoMeta } from '../lib/blog.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImagePicker } from './ImagePicker';

interface SeoPanelProps {
  value: SeoMeta | null | undefined;
  onChange: (seo: SeoMeta | null) => void;
  postId?: number;
  tempId: string;
}

const defaultSeo: SeoMeta = {
  title: null,
  description: null,
  keywords: [],
  canonicalUrl: null,
  ogImage: null,
  twitterCard: 'summary_large_image',
};

export function SeoPanel({ value, onChange, postId, tempId }: SeoPanelProps) {
  const seo = useMemo(() => ({ ...defaultSeo, ...value, keywords: value?.keywords ?? [] }), [value]);

  function update(partial: Partial<SeoMeta>) {
    const next = { ...seo, ...partial };
    onChange(next);
  }

  function updateOgImage(asset: MediaAsset | null) {
    update({ ogImage: asset });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seo-title">SEO Title</Label>
        <Input
          id="seo-title"
          value={seo.title ?? ''}
          onChange={(event) => update({ title: event.target.value || null })}
          placeholder="Override title for search engines"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-description">Meta Description</Label>
        <Textarea
          id="seo-description"
          value={seo.description ?? ''}
          onChange={(event) => update({ description: event.target.value || null })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-keywords">Keywords</Label>
        <Input
          id="seo-keywords"
          value={seo.keywords.join(', ')}
          onChange={(event) =>
            update({
              keywords: event.target.value
                .split(',')
                .map((keyword) => keyword.trim())
                .filter(Boolean),
            })
          }
          placeholder="comma,separated,keywords"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-canonical">Canonical URL</Label>
        <Input
          id="seo-canonical"
          value={seo.canonicalUrl ?? ''}
          onChange={(event) => update({ canonicalUrl: event.target.value || null })}
          placeholder="https://example.com/blog/post"
        />
      </div>
      <div className="space-y-2">
        <Label>Open Graph Image</Label>
        <ImagePicker value={seo.ogImage ?? null} onChange={updateOgImage} postId={postId} tempId={tempId} folder="og" />
      </div>
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <div>
          <Label htmlFor="seo-twitter-card">Twitter Card: summary vs large image</Label>
          <p className="text-sm text-muted-foreground">Toggle to enable large image card preview.</p>
        </div>
        <Switch
          id="seo-twitter-card"
          checked={seo.twitterCard === 'summary_large_image'}
          onCheckedChange={(checked) =>
            update({ twitterCard: checked ? 'summary_large_image' : 'summary' })
          }
        />
      </div>
    </div>
  );
}
