import type { ContentBlock } from '../lib/blog.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImagePicker } from './ImagePicker';

interface ContentBlockEditorProps {
  value: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  postId?: number;
  tempId: string;
}

const blockOptions: Array<{ label: string; kind: ContentBlock['kind'] }> = [
  { label: 'Paragraph', kind: 'Paragraph' },
  { label: 'Heading', kind: 'Heading' },
  { label: 'Quote', kind: 'Quote' },
  { label: 'List', kind: 'List' },
  { label: 'Image', kind: 'Image' },
  { label: 'Code snippet', kind: 'Code' },
  { label: 'Embed', kind: 'Embed' },
  { label: 'Callout', kind: 'Callout' },
  { label: 'Divider', kind: 'Divider' },
];

const toneOptions = ['info', 'success', 'warning', 'danger', 'tip'] as const;

export function ContentBlockEditor({ value, onChange, postId, tempId }: ContentBlockEditorProps) {
  function addBlock(kind: ContentBlock['kind']) {
    onChange([...value, createBlock(kind)]);
  }

  function updateBlock(index: number, block: ContentBlock) {
    const next = [...value];
    next[index] = block;
    onChange(next);
  }

  function removeBlock(index: number) {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {value.map((block, index) => (
        <div key={index} className="space-y-4 rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {index + 1}. {block.kind}
            </h4>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                Up
              </Button>
              <Button variant="outline" size="sm" onClick={() => moveBlock(index, 1)} disabled={index === value.length - 1}>
                Down
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeBlock(index)}>
                Remove
              </Button>
            </div>
          </div>
          <BlockFields
            block={block}
            onChange={(next) => updateBlock(index, next)}
            postId={postId}
            tempId={tempId}
          />
        </div>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Add content block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {blockOptions.map((option) => (
            <DropdownMenuItem key={option.kind} onClick={() => addBlock(option.kind)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function createBlock(kind: ContentBlock['kind']): ContentBlock {
  switch (kind) {
    case 'Paragraph':
      return { kind: 'Paragraph', text: '' };
    case 'Heading':
      return { kind: 'Heading', level: 2, text: '', anchor: null };
    case 'Quote':
      return { kind: 'Quote', text: '', attribution: null };
    case 'List':
      return { kind: 'List', ordered: false, items: [] };
    case 'Image':
      return {
        kind: 'Image',
        asset: {
          ref: { bucket: '', path: '', mime: null, size: null },
          alt: '',
          caption: null,
          credit: null,
          aspectRatio: null,
        },
        fullWidth: false,
      };
    case 'Code':
      return { kind: 'Code', language: 'plaintext', code: '' };
    case 'Embed':
      return { kind: 'Embed', provider: null, url: '', title: null };
    case 'Callout':
      return { kind: 'Callout', tone: 'info', title: '', body: '' };
    case 'Divider':
    default:
      return { kind: 'Divider' };
  }
}

interface BlockFieldsProps {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
  postId?: number;
  tempId: string;
}

function BlockFields({ block, onChange, postId, tempId }: BlockFieldsProps) {
  switch (block.kind) {
    case 'Paragraph':
      return (
        <Textarea
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          rows={4}
        />
      );
    case 'Heading':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={String(block.level)} onValueChange={(value) => onChange({ ...block, level: Number(value) })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    Heading {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Anchor (optional)</Label>
            <Input
              value={block.anchor ?? ''}
              onChange={(event) => onChange({ ...block, anchor: event.target.value || null })}
              placeholder="custom-anchor-id"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Heading text</Label>
            <Input value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} />
          </div>
        </div>
      );
    case 'Quote':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Quote</Label>
            <Textarea value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Attribution</Label>
            <Input
              value={block.attribution ?? ''}
              onChange={(event) => onChange({ ...block, attribution: event.target.value || null })}
            />
          </div>
        </div>
      );
    case 'List': {
      const text = block.items.join('\n');
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Label>Ordered list</Label>
            <Button variant={block.ordered ? 'default' : 'outline'} size="sm" onClick={() => onChange({ ...block, ordered: !block.ordered })}>
              {block.ordered ? 'Ordered' : 'Bullets'}
            </Button>
          </div>
          <Textarea
            value={text}
            onChange={(event) =>
              onChange({
                ...block,
                items: event.target.value
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
            rows={4}
            placeholder="One item per line"
          />
        </div>
      );
    }
    case 'Image':
      return (
        <div className="space-y-4">
          <ImagePicker
            value={block.asset.ref.path ? block.asset : null}
            onChange={(asset) => {
              if (asset) {
                onChange({ ...block, asset });
              }
            }}
            postId={postId}
            tempId={tempId}
            folder="content"
            allowRemove={false}
          />
          <div className="flex items-center gap-2">
            <Label>Full width</Label>
            <Button variant={block.fullWidth ? 'default' : 'outline'} size="sm" onClick={() => onChange({ ...block, fullWidth: !block.fullWidth })}>
              {block.fullWidth ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      );
    case 'Code':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Language</Label>
            <Input
              value={block.language}
              onChange={(event) => onChange({ ...block, language: event.target.value })}
              placeholder="typescript"
            />
          </div>
          <div className="space-y-2">
            <Label>Code</Label>
            <Textarea
              value={block.code}
              onChange={(event) => onChange({ ...block, code: event.target.value })}
              rows={6}
            />
          </div>
        </div>
      );
    case 'Embed':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input
              value={block.provider ?? ''}
              onChange={(event) => onChange({ ...block, provider: event.target.value || null })}
              placeholder="YouTube"
            />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={block.title ?? ''}
              onChange={(event) => onChange({ ...block, title: event.target.value || null })}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>URL</Label>
            <Input
              value={block.url}
              onChange={(event) => onChange({ ...block, url: event.target.value })}
              placeholder="https://"
            />
          </div>
        </div>
      );
    case 'Callout':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={block.tone} onValueChange={(tone) => onChange({ ...block, tone: tone as typeof block.tone })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((tone) => (
                  <SelectItem key={tone} value={tone}>
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={block.title} onChange={(event) => onChange({ ...block, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={block.body}
              onChange={(event) => onChange({ ...block, body: event.target.value })}
              rows={4}
            />
          </div>
        </div>
      );
    case 'Divider':
      return <p className="text-sm text-muted-foreground">A horizontal rule separates sections.</p>;
    default:
      return null;
  }
}
