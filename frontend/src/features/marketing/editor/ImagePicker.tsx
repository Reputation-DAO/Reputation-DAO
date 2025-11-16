import { useMemo, useRef, useState } from 'react';
import type { MediaAsset } from '../lib/blog.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SUPABASE_BUCKET, makeMediaAsset, uploadObject } from '../lib/supabaseClient';
import { useSupabaseAssetUrl } from '../utils/contentRenderer';

interface ImagePickerProps {
  value: MediaAsset | null;
  onChange: (asset: MediaAsset | null) => void;
  postId?: number;
  tempId: string;
  folder?: string;
  allowRemove?: boolean;
}

export function ImagePicker({
  value,
  onChange,
  postId,
  tempId,
  folder = 'media',
  allowRemove = true,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const previewUrl = useSupabaseAssetUrl(value);
  const resolvedTempId = useMemo(() => {
    if (tempId) return tempId;
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return Math.random().toString(36).slice(2);
  }, [tempId]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      const basePath = postId ? `posts/${postId}` : `posts/tmp/${resolvedTempId}`;
      const objectPath = `${basePath}/${folder}/${safeName}`;
      const { path, size, mime } = await uploadObject(SUPABASE_BUCKET, objectPath, file);
      const asset = makeMediaAsset({
        bucket: SUPABASE_BUCKET,
        path,
        alt: value?.alt ?? file.name,
        size,
        mime,
        caption: value?.caption ?? null,
        credit: value?.credit ?? null,
        aspectRatio: value?.aspectRatio ?? null,
      });
      onChange(asset);
    } catch (error) {
      console.error('Failed to upload media', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function updateMeta(partial: Partial<Omit<MediaAsset, 'ref'>>) {
    if (!value) return;
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4 rounded-md border border-dashed border-border p-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </Button>
        {allowRemove && value && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
        {value && <span className="text-xs text-muted-foreground">{value.ref.path}</span>}
      </div>

      {value && (
        <div className="grid gap-4 md:grid-cols-[200px,1fr] md:gap-6">
          <div className="overflow-hidden rounded-md border border-border">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={value.alt}
                className="h-48 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="grid h-48 place-items-center bg-muted">
                <span className="text-xs text-muted-foreground">Awaiting Supabase URL</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-alt">Alt text</Label>
              <Input
                id="asset-alt"
                value={value.alt}
                onChange={(event) => updateMeta({ alt: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-caption">Caption</Label>
              <Input
                id="asset-caption"
                value={value.caption ?? ''}
                onChange={(event) => updateMeta({ caption: event.target.value || null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-credit">Credit</Label>
              <Input
                id="asset-credit"
                value={value.credit ?? ''}
                onChange={(event) => updateMeta({ credit: event.target.value || null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-aspect">Aspect ratio</Label>
              <Input
                id="asset-aspect"
                placeholder="16:9"
                value={value.aspectRatio ?? ''}
                onChange={(event) => updateMeta({ aspectRatio: event.target.value || null })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
