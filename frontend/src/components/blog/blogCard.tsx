import { Card, CardContent, CardMedia, Typography, Box, Link } from "@mui/material";
import type { Post } from "../canister/blogBackend";
import { Link as RouterLink } from "react-router-dom";

interface Props {
  post: Post;
}

export default function BlogCard({ post }: Props) {
  const timestamp =
    typeof post?.date === "number" ? Number(post.date) / 1_000_000 : Date.now();
  const date = new Date(timestamp).toLocaleDateString();


  return (
    <Link
      component={RouterLink}
      to={`/posts/${post.id}`}
      underline="none"
      sx={{ cursor: "pointer", display: "block" }}
    >
      <Card
        elevation={8}
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          bgcolor: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          "&:hover": {
            boxShadow: "0 20px 40px hsl(var(--shadow) / 0.15)",
            borderColor: "hsl(var(--foreground))",
          },
          width: 320,
          height: 320,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image container */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            height: "50%",
          }}
        >
          <CardMedia
            component="img"
            image={post.image}
            alt={post.title}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          />
        </Box>

        {/* Content */}
        <CardContent
          sx={{
            flexGrow: 1,
            p: 2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "hsl(var(--foreground))",
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
            title={post.title}
          >
            {post.title}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mb: 1,
              fontWeight: 600,
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {date} &bull; {post.author?.name ?? "Unknown author"}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              lineHeight: 1.4,
              fontSize: "0.9rem",
              userSelect: "text",
              color: "hsl(var(--muted-foreground))",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {post.content}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
}
