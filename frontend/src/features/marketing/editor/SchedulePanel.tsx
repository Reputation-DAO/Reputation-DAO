import { useMemo } from 'react';
import type { PostStatus } from '../lib/blog.types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface SchedulePanelProps {
  status: PostStatus;
  onStatusChange: (status: PostStatus) => void;
  scheduledFor: number | null | undefined;
  onScheduledForChange: (timestamp: number | null) => void;
}

const statuses: PostStatus[] = ['Draft', 'Scheduled', 'Published', 'Archived'];

function secondsToLocalInput(seconds: number | null | undefined): string {
  if (seconds === undefined || seconds === null) return '';
  const date = new Date(seconds * 1000);
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60_000);
  return local.toISOString().slice(0, 16);
}

function localInputToSeconds(value: string): number | null {
  if (!value) return null;
  const date = new Date(value);
  return Math.floor(date.getTime() / 1000);
}

export function SchedulePanel({ status, onStatusChange, scheduledFor, onScheduledForChange }: SchedulePanelProps) {
  const scheduleValue = useMemo(() => secondsToLocalInput(scheduledFor ?? null), [scheduledFor]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(value: PostStatus) => onStatusChange(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(status === 'Scheduled' || status === 'Published') && (
        <div className="space-y-2">
          <Label htmlFor="scheduled-at">
            {status === 'Published' ? 'Publish Date' : 'Schedule for'}
          </Label>
          <Input
            id="scheduled-at"
            type="datetime-local"
            value={scheduleValue}
            onChange={(event) => onScheduledForChange(localInputToSeconds(event.target.value))}
          />
        </div>
      )}
    </div>
  );
}
