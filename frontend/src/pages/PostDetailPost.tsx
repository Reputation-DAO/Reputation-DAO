import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Chip, 
  Stack 
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

        // Unwrap optional array returned from Motoko (?Post)
        if (Array.isArray(fetched) && fetched.length > 0) {
          const postObj = {
            ...fetched[0],
            // Convert status variant { Published: null } → "Published"
            status: Object.keys(fetched[0].status)[0] as "Draft" | "Published" | "Archived",
          };
          setPost(postObj);
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", height: "80vh", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Post not found
        </Typography>
      </Container>
    );
  }

  // Motoko Time.now() is in nanoseconds → convert to ms
  const timestamp = typeof post.date === "number" ? post.date / 1_000_000 : Date.now();
  const dateStr = new Date(timestamp).toLocaleDateString();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Title */}
      <Typography
        variant="h2"
        fontWeight={900}
        mb={2}
        sx={{
          position: "relative",
          transition: "color 0.3s ease",
          "&:hover": { color: "hsl(var(--primary-light))", cursor: "default" },
          "&:after": {
            content: '""',
            position: "absolute",
            width: "40%",
            height: 3,
            bottom: -6,
            left: 0,
            bgcolor: "hsl(var(--primary-light))",
            borderRadius: 2,
          },
        }}
      >
        {post.title}
      </Typography>

      {/* Date + Author */}
      <Typography variant="subtitle2" color="text.secondary" mb={3} fontWeight={600}>
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
            maxHeight: 400,
            objectFit: "cover",
            borderRadius: 2,
            mb: 4,
            transition: "transform 0.5s ease",
            "&:hover": { transform: "scale(1.03)", filter: "brightness(1.05)" },
          }}
        />
      )}

      {/* Content */}
      <Typography
        variant="body1"
        sx={{
          color: "text.primary",
          opacity: 0.85,
          lineHeight: 1.6,
          fontSize: "1.125rem",
          whiteSpace: "pre-line",
          mb: 4,
          userSelect: "text",
        }}
      >
        {post.content}
      </Typography>

      {/* Meta info */}
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
        <Chip label={`Category: ${post.category}`} color="primary" />
        <Chip label={`Views: ${post.views ?? 0}`} />
        <Chip label={`Status: ${post.status}`} />
        <Chip label={`Editor’s Pick: ${post.isEditorsPick ? "Yes" : "No"}`} />
        <Chip label={`Featured: ${post.isFeatured ? "Yes" : "No"}`} />
      </Stack>

      {/* Author Avatar */}
      {post.author?.avatar && (
        <Box
          component="img"
          src={post.author.avatar}
          alt={`${post.author.name ?? "Author"} avatar`}
          sx={{ width: 60, height: 60, borderRadius: "50%" }}
        />
      )}
    </Container>
  );
}
