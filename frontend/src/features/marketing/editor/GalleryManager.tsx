import { useState } from 'react';
import type { MediaAsset } from '../lib/blog.types';
import { Button } from '@/components/ui/button';
import { ImagePicker } from './ImagePicker';

interface GalleryManagerProps {
  value: MediaAsset[];
  onChange: (assets: MediaAsset[]) => void;
  postId?: number;
  tempId: string;
}

export function GalleryManager({ value, onChange, postId, tempId }: GalleryManagerProps) {
  const [addKey, setAddKey] = useState(0);

  function updateAsset(index: number, asset: MediaAsset | null) {
    const next = [...value];
    if (asset) {
      next[index] = asset;
      onChange(next);
    } else {
      next.splice(index, 1);
      onChange(next);
    }
  }

  function handleAdd(asset: MediaAsset | null) {
    if (!asset) return;
    onChange([...value, asset]);
    setAddKey((key) => key + 1);
  }

  return (
    <div className="space-y-6">
      {value.map((asset, index) => (
        <div key={asset.ref.path} className="rounded-md border border-border p-4">
          <div className="flex items-center justify-between pb-2">
            <h4 className="text-sm font-semibold">Item {index + 1}</h4>
            <Button variant="ghost" size="sm" onClick={() => updateAsset(index, null)}>
              Remove
            </Button>
          </div>
          <ImagePicker value={asset} onChange={(next) => updateAsset(index, next)} postId={postId} tempId={tempId} folder="gallery" />
        </div>
      ))}
      <div className="rounded-md border border-dashed border-border p-4">
        <h4 className="mb-3 text-sm font-semibold">Add to gallery</h4>
        <ImagePicker
          key={addKey}
          value={null}
          onChange={handleAdd}
          postId={postId}
          tempId={tempId}
          folder="gallery"
          allowRemove={false}
        />
      </div>
    </div>
  );
}
