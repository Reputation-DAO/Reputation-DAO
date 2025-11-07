import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fetchBlogPosts, updateBlogPostStatus } from '../api/blog.client';
import type { Post } from '../lib/blog.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

interface PostListProps {
  onSelectPost?: (post: Post) => void;
  onPreview?: (post: Post) => void;
}

const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Draft: 'secondary',
  Scheduled: 'outline',
  Published: 'default',
  Archived: 'destructive',
};

export function PostList({ onSelectPost, onPreview }: PostListProps) {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: fetchBlogPosts,
  });
  const { toast } = useToast();

  const posts = useMemo(
    () => (data ?? []).filter((post) => post.status !== 'Archived'),
    [data],
  );

  async function handleDelete(post: Post) {
    const ok = window.confirm(
      `Delete "${post.title}"?\nThis archives the post and removes it from lists.`,
    );
    if (!ok) return;
    try {
      await updateBlogPostStatus(post.id, 'Archived', null);
      toast({
        title: 'Post archived',
        description: `"${post.title}" has been removed from the list.`,
      });
      await refetch();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to delete',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Posts</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Views</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 3 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ))}

          {!isLoading &&
            posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="font-medium">{post.title}</div>
                  <div className="text-xs text-muted-foreground">{post.slug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColor[post.status] ?? 'outline'}>{post.status}</Badge>
                </TableCell>
                <TableCell>{post.category}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(post.updatedAt * 1000, { addSuffix: true })}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{post.metrics.views}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onPreview?.(post)}>
                    Preview
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onSelectPost?.(post)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(post)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
        <TableCaption>{posts.length ? `${posts.length} posts` : 'No posts yet.'}</TableCaption>
      </Table>
    </div>
  );
}
