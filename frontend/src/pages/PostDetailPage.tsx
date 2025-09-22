// frontend/src/pages/PostDetailPage.tsx
// @ts-nocheck
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useState } from "react";
import { blogActor, type Post } from "../components/canister/blogBackend";

// shadcn/ui primitives
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// icons
import { Loader2 } from "lucide-react";

type PostStatusStr = "Draft" | "Published" | "Archived";
type PostView = Omit<Post, "status"> & { status: PostStatusStr };

function resolveUrl(input?: unknown): string | undefined {
  if (!input) return;
  if (typeof input !== "string") return;
  if (/^(https?:|data:|blob:)/i.test(input)) return input; // absolute/data/blob
  if (input.startsWith("/")) return input; // site-absolute
  try {
    return new URL(input, window.location.origin).toString();
  } catch {
    return input;
  }
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostView | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgOk, setImgOk] = useState(true);
  const [avatarOk, setAvatarOk] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const opt = await blogActor.getPostById(Number(id));
        const raw: Post | null = Array.isArray(opt) && opt.length > 0 ? opt[0] : null;
        if (!raw) {
          setPost(null);
          return;
        }
        const statusKey = Object.keys(raw.status)[0] as PostStatusStr;
        setPost({ ...raw, status: statusKey });
      } catch (err) {
        console.error(err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const timestamp =
    typeof post?.date === "number" ? Number(post.date) / 1_000_000 : Date.now();
  const dateStr = useMemo(() => new Date(timestamp).toLocaleDateString(), [timestamp]);

  const imageSrc = resolveUrl(post?.image);
  const avatarSrc = resolveUrl(post?.author?.avatar);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh] bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Alert variant="destructive" className="mx-auto max-w-md">
          <AlertDescription>Post not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 md:px-6 py-4 md:py-8">
      <Card className="p-5 md:p-10 rounded-2xl border-[1px] bg-background/80 backdrop-blur-xl shadow-xl transition-all hover:shadow-2xl">
        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground relative mb-3">
          {post.title}
          <span className="absolute left-0 -bottom-2 h-1 w-2/5 bg-gradient-to-r from-primary to-primary/40 rounded-full transition-all group-hover:w-full" />
        </h1>

        {/* Date + Author */}
        <div className="text-sm md:text-base text-muted-foreground font-semibold mb-6">
          {dateStr} · {post.author?.name ?? "Unknown author"}
        </div>

        {/* Cover Image */}
        {imageSrc && imgOk && (
          <img
            src={imageSrc}
            alt={post.title}
            onError={() => setImgOk(false)}
            className="w-full max-h-[480px] object-cover rounded-xl mb-6 shadow-lg transition-transform duration-500 hover:scale-[1.03] hover:brightness-105"
          />
        )}

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none mb-6 leading-relaxed text-foreground/95 text-[1.05rem]">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h2 className="mt-8 mb-3 text-2xl font-bold" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h3 className="mt-6 mb-2 text-xl font-semibold" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-3 leading-7" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="mb-1 leading-7" {...props} />
              ),
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code className="px-1 py-0.5 rounded bg-muted text-foreground" {...props} />
                ) : (
                  <code className="block p-3 rounded-lg bg-muted text-foreground overflow-x-auto" {...props} />
                ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Badge className="font-semibold" variant="default">
            Category: {post.category}
          </Badge>
          <Badge variant="secondary">Views: {Number(post.views) ?? 0}</Badge>
          <Badge variant={post.status === "Published" ? "default" : "secondary"}>
            Status: {post.status}
          </Badge>
          <Badge variant={post.isEditorsPick ? "default" : "outline"}>
            Editor’s Pick: {post.isEditorsPick ? "Yes" : "No"}
          </Badge>
          <Badge variant={post.isFeatured ? "default" : "outline"}>
            Featured: {post.isFeatured ? "Yes" : "No"}
          </Badge>
        </div>

        {/* Author */}
        {avatarSrc && avatarOk && (
          <div className="flex items-center gap-3 mt-2">
            <img
              src={avatarSrc}
              alt={`${post.author?.name ?? "Author"} avatar`}
              onError={() => setAvatarOk(false)}
              className="w-16 h-16 rounded-full shadow-md transition-transform duration-300 hover:scale-110"
            />
            <div>
              <div className="font-bold text-foreground">{post.author?.name}</div>
              <div className="text-xs text-muted-foreground">About the author</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
