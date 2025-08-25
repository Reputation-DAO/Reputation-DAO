import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Stack,
  Paper,
  CardMedia,
} from "@mui/material";
import { blogActor, type Post } from "../components/canister/blogBackend";

type PostStatusStr = "Draft" | "Published" | "Archived";
type PostView = Omit<Post, "status"> & { status: PostStatusStr };

function resolveUrl(input?: unknown): string | undefined {
  if (!input) return;
  if (typeof input !== "string") return;

  // already absolute or data/blob URL
  if (/^(https?:|data:|blob:)/i.test(input)) return input;

  // leading slash → site-absolute
  if (input.startsWith("/")) return input;

  // relative → make absolute against origin
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
        // Motoko ?Post → JS [] | [Post]
        const raw: Post | null =
          Array.isArray(opt) && opt.length > 0 ? opt[0] : null;

        if (!raw) {
          setPost(null);
          return;
        }

        const statusKey = Object.keys(raw.status)[0] as PostStatusStr;

        // normalize into PostView
        setPost({
          ...raw,
          status: statusKey,
        });
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

  // Normalize image URLs so nested routes don’t break them
  const imageSrc = resolveUrl(post?.image);
  const avatarSrc = resolveUrl(post?.author?.avatar);

  if (loading)
    return (
      <Box className="flex justify-center items-center h-[80vh]">
        <CircularProgress sx={{ color: "hsl(var(--primary))" }} />
      </Box>
    );

  if (!post)
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Post not found
        </Typography>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 0, md: 0 } }}>
      <Paper
        sx={{
          p: { xs: 3, md: 6 },
          borderRadius: "var(--radius)",
          border: "var(--glass-border)",
          backdropFilter: "var(--glass-blur)",
          backgroundColor: "hsl(var(--background))",
          boxShadow: "var(--shadow-lg)",
          transition: "var(--transition-smooth)",
          "&:hover": {
            boxShadow:
              "0 12px 32px rgba(0,0,0,0.12), 0 16px 64px rgba(0,0,0,0.08)",
          },
        }}
      >
        {/* Title */}
        <Typography
          variant="h1"
          fontWeight={900}
          mb={2}
          sx={{
            fontSize: { xs: "2rem", md: "3rem" },
            position: "relative",
            bgClip: "text",
            color: "hsl(var(--foreground))",
            "&:after": {
              content: '""',
              position: "absolute",
              width: "45%",
              height: 4,
              bottom: -6,
              left: 0,
              borderRadius: 2,
              backgroundImage: "var(--gradient-header)",
              transition: "width 0.4s ease",
            },
            "&:hover:after": { width: "100%" },
          }}
        >
          {post.title}
        </Typography>

        {/* Date + Author */}
        <Typography
          variant="subtitle2"
          color="hsl(var(--foreground))"
          mb={4}
          fontWeight={600}
        >
          {dateStr} · {post.author?.name ?? "Unknown author"}
        </Typography>

        {/* Image (only render if we have a good src and no error) */}
        {imageSrc && imgOk && (
          <CardMedia
            component="img"
            image={imageSrc}
            alt={post.title}
            onError={() => setImgOk(false)}
            sx={{
              width: "100%",
              maxHeight: 480,
              objectFit: "cover",
              borderRadius: "var(--radius)",
              mb: 5,
              boxShadow: "var(--shadow-md)",
              transition: "transform 0.5s ease, filter 0.5s ease",
              "&:hover": {
                transform: "scale(1.035)",
                filter: "brightness(1.08)",
              },
            }}
          />
        )}

        {/* Content */}
        <Typography
          variant="body1"
          sx={{
            color: "hsl(var(--foreground))",
            opacity: 0.95,
            lineHeight: 1.85,
            fontSize: "1.125rem",
            whiteSpace: "pre-line",
            mb: 5,
            userSelect: "text",
            
          }}
        >
          <ReactMarkdown
  components={{
    h1: ({ node, ...props }) => (
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mt: 4, mb: 2, fontWeight: 700 }}
        {...props}
      />
    ),
    h2: ({ node, ...props }) => (
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mt: 3, mb: 1.5, fontWeight: 600 }}
        {...props}
      />
    ),
    p: ({ node, ...props }) => (
      <Typography
        variant="body1"
        sx={{
          color: "hsl(var(--foreground))",
          opacity: 0.95,
          lineHeight: 1.6, // tighter, less airy
          fontSize: "1.05rem", // slightly smaller for balance
          mb: 2, // reduced bottom margin
        }}
        {...props}
      />
    ),
    li: ({ node, ...props }) => (
      <li>
        <Typography
          component="span"
          variant="body1"
          sx={{ lineHeight: 1.6, fontSize: "1.05rem" }}
          {...props}
        />
      </li>
    ),
  }}
>
  {post.content}
</ReactMarkdown>


        </Typography>

        {/* Meta info */}
        <Stack
          direction="row"
          spacing={1.5}
          mb={4}
          flexWrap="wrap"
          sx={{
            "& .MuiChip-root": {
              backdropFilter: "var(--glass-blur)",
              border: "var(--glass-border)",
              fontWeight: 600,
              transition: "var(--transition-smooth)",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-2px) scale(1.05)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              },
            },
          }}
        >
          <Chip
            label={`Category: ${post.category}`}
            sx={{
              bgcolor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          />
          <Chip label={`Views: ${Number(post.views) ?? 0}`} />
          <Chip label={`Status: ${post.status}`} />
          <Chip label={`Editor’s Pick: ${post.isEditorsPick ? "Yes" : "No"}`} />
          <Chip label={`Featured: ${post.isFeatured ? "Yes" : "No"}`} />
        </Stack>

        {/* Author */}
        {avatarSrc && avatarOk && (
          <Stack direction="row" spacing={2} alignItems="center" mt={3}>
            <Box
              component="img"
              src={avatarSrc}
              alt={`${post.author?.name ?? "Author"} avatar`}
              onError={() => setAvatarOk(false)}
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                boxShadow: "var(--shadow-md)",
                transition: "transform 0.4s ease, box-shadow 0.4s ease",
                "&:hover": {
                  transform: "scale(1.1)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                },
              }}
            />
            <Box>
              <Typography fontWeight={700} color="hsl(var(--foreground))">
                {post.author?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                About the author
              </Typography>
            </Box>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
