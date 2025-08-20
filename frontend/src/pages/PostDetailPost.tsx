import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import { blogActor, type Post } from "../components/canister/blogBackend";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const fetched = await blogActor.getPostById(Number(id));
        if (Array.isArray(fetched) && fetched.length > 0) {
          setPost({
            ...fetched[0],
            status: Object.keys(fetched[0].status)[0] as
              | "Draft"
              | "Published"
              | "Archived",
          });
        } else setPost(null);
      } catch (err) {
        console.error(err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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

  const timestamp =
    typeof post.date === "number" ? post.date / 1_000_000 : Date.now();
  const dateStr = new Date(timestamp).toLocaleDateString();

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
            boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 16px 64px rgba(0,0,0,0.08)",
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

        {/* Image */}
        {post.image && (
          <Box
            component="img"
            src={post.image}
            alt={post.title}

            sx={{
              width: "100%",
              maxHeight: 480,
              objectFit: "cover",
              borderRadius: "var(--radius)",
              mb: 5,
              boxShadow: "var(--shadow-md)",
              transition: "transform 0.5s ease, filter 0.5s ease",
              color:"hsl(var(--foreground))",
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
            "&::first-letter": {
              fontSize: "2rem",
              fontWeight: 700,
              float: "left",
              lineHeight: 1,
              mr: 1,
            },
          }}
        >
          {post.content}
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
          <Chip label={`Views: ${post.views ?? 0}`} />
          <Chip label={`Status: ${post.status}`} />
          <Chip label={`Editor’s Pick: ${post.isEditorsPick ? "Yes" : "No"}`} />
          <Chip label={`Featured: ${post.isFeatured ? "Yes" : "No"}`} />
        </Stack>

        {/* Author */}
        {post.author?.avatar && (
          <Stack direction="row" spacing={2} alignItems="center" mt={3}>
            <Box
              component="img"
              src={post.author.avatar}
              alt={`${post.author.name ?? "Author"} avatar`}
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
                {post.author.name}
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
