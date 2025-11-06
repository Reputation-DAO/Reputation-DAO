import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import type { Post } from './lib/blog.types';
import { PostEditor } from './editor/PostEditor';
import { PostList } from './views/PostList';
import { PostPreview } from './views/PostPreview';

export default function CreatorPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const { toast } = useToast();

  function handleEditorComplete(post: Post) {
    setSelectedPost(post);
    setPreviewPost(post);
    toast({
      title: 'Post saved',
      description: 'Media assets are synced and the canister has been updated.',
    });
  }

  function handleNewPost() {
    setSelectedPost(null);
    setPreviewPost(null);
  }

  return (
    <div className="container mx-auto space-y-8 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Studio</h1>
          <p className="text-sm text-muted-foreground">
            Craft long-form content, upload media to Supabase, and publish through the on-chain blog backend.
          </p>
        </div>
        <Button variant="outline" onClick={handleNewPost}>
          Start new draft
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Existing posts</CardTitle>
            </CardHeader>
            <CardContent>
              <PostList
                onSelectPost={(post) => {
                  setSelectedPost(post);
                  setPreviewPost(post);
                }}
                onPreview={(post) => setPreviewPost(post)}
              />
            </CardContent>
          </Card>
          {previewPost && (
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-y-auto">
                <PostPreview post={previewPost} />
              </CardContent>
            </Card>
          )}
        </aside>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedPost ? `Editing: ${selectedPost.title}` : 'New post'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PostEditor initialPost={selectedPost ?? undefined} onComplete={handleEditorComplete} />
            </CardContent>
          </Card>
          <Separator className="my-8" />
          {previewPost && (
            <div className="lg:hidden">
              <PostPreview post={previewPost} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
