import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  PlusCircle, 
  FileText, 
  Eye, 
  Settings, 
  Wifi, 
  WifiOff,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import type { Post } from './lib/blog.types';
import { PostEditor } from './editor/PostEditor';
import { PostList } from './views/PostList';
import { PostPreview } from './views/PostPreview';
import { useAuth } from '@/contexts/AuthContext';
import { ensurePlugAgent } from '@/utils/plug';
import { ensureInternetIdentityAgent } from '@/utils/internetIdentity';
import {
  BLOG_BACKEND_CANISTER_ID,
  configureBlogBackendActor,
  resetBlogBackendActor,
  BLOG_HOST,
} from './api/blog.client';

export default function CreatorPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<'neutral' | 'error'>('neutral');
  const { toast } = useToast();
  const { isAuthenticated, authMethod } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function syncBlogActor() {
      if (!isAuthenticated || !authMethod) {
        resetBlogBackendActor();
        if (!cancelled) {
          setStatusMessage('Connect Plug or Internet Identity to create or edit posts.');
          setStatusVariant('error');
        }
        return;
      }

      try {
        if (authMethod === 'plug') {
          const agent = await ensurePlugAgent({
            host: BLOG_HOST,
            whitelist: [BLOG_BACKEND_CANISTER_ID],
          });
          if (!cancelled) {
            configureBlogBackendActor(agent);
            setStatusMessage('Plug connected. You can now publish posts.');
            setStatusVariant('neutral');
          }
        } else if (authMethod === 'internetIdentity') {
          const agent = await ensureInternetIdentityAgent({ host: BLOG_HOST });
          if (!cancelled) {
            configureBlogBackendActor(agent);
            setStatusMessage('Internet Identity connected. You can now publish posts.');
            setStatusVariant('neutral');
          }
        }
      } catch (error) {
        console.error('Failed to configure blog backend actor', error);
        if (!cancelled) {
          toast({
            title: 'Wallet required',
            description: 'Connect Plug or Internet Identity to create or edit posts.',
            variant: 'destructive',
          });
          setStatusMessage('Wallet connection failed. Please retry.');
          setStatusVariant('error');
          resetBlogBackendActor();
        }
      }
    }

    syncBlogActor();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authMethod, toast]);

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

  const isConnected = statusVariant === 'neutral' && isAuthenticated;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Professional Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Creator Studio
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Professional content creation platform
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={isConnected ? "default" : "destructive"} className="gap-2">
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button 
                onClick={handleNewPost}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 gap-3 text-base"
              >
                <PlusCircle className="h-5 w-5" />
                Start New Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr_300px]">
          {/* Left Sidebar - Content Management */}
          <aside className="space-y-6">
            {/* Connection Status */}
            <Card className={`border-2 transition-all duration-200 ${
              statusVariant === 'error' 
                ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' 
                : 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${
                    statusVariant === 'error' ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                  }`}>
                    {statusMessage}
                  </p>
                  {authMethod && (
                    <Badge variant="outline" className="text-xs">
                      {authMethod === 'plug' ? 'Plug Wallet' : 'Internet Identity'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Library */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">Content Library</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Craft long-form content, upload media to Supabase, and publish through the on-chain blog backend.
                </CardDescription>
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
          </aside>

          {/* Main Editor Area */}
          <section className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {selectedPost ? `Editing: ${selectedPost.title}` : 'New post'}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {selectedPost ? 'Make your changes and save to update' : 'Create engaging content for your audience'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <PostEditor initialPost={selectedPost ?? undefined} onComplete={handleEditorComplete} />
              </CardContent>
            </Card>
          </section>

          {/* Right Sidebar - Preview */}
          <aside className="space-y-6">
            {previewPost && (
              <Card className="border-slate-200 dark:border-slate-800 sticky top-24">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <CardTitle className="text-sm font-medium">Live Preview</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    See how your content will appear to readers
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <PostPreview post={previewPost} />
                </CardContent>
              </Card>
            )}
            
            {!previewPost && (
              <Card className="border-dashed border-slate-300 dark:border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Eye className="h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">No Preview Available</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Select or create a post to see the live preview
                  </p>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>

        {/* Mobile Preview */}
        {previewPost && (
          <div className="lg:hidden mt-8">
            <Separator className="mb-6" />
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <CardTitle className="text-base">Preview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <PostPreview post={previewPost} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
