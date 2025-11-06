import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fetchBlogPosts } from '../api/blog.client';
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

  const posts = useMemo(() => data ?? [], [data]);

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
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
        <TableCaption>{posts.length ? `${posts.length} posts` : 'No posts yet.'}</TableCaption>
      </Table>
    </div>
  );
}
