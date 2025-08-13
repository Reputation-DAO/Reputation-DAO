import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Link,
} from "@mui/material";
import type { Post } from "../canister/blogBackend";
import { Link as RouterLink } from "react-router-dom";

interface Props {
  post: Post;
}

export default function FeaturedBlogCard({ post }: Props) {
  const date = new Date(Number(post.date) / 1_000_000).toLocaleDateString();

  return (
    <Link
      component={RouterLink}
      to={`/posts/${post.id}`}
      underline="none"
      sx={{ cursor: "pointer", display: "block" }}
    >
      <Card
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          borderRadius: 1,
          border: "1.5px solid hsl(var(--primary))",
          overflow: "hidden",
          minHeight: { xs: 320, md: 360 },
          boxShadow: "var(--shadow-lg)",
          transition:
            "transform 0.35s ease, box-shadow 0.35s ease, border-color 0.3s ease",
          bgcolor: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "var(--shadow-xl)",
            borderColor: "hsl(var(--foreground))",
          },
        }}
      >
        {/* Image Container */}
        <Box
          sx={{
            flex: { xs: "none", md: "0 0 50%" },
            position: "relative",
            overflow: "hidden",
          }}
        >
          <CardMedia
            component="img"
            image={post.image}
            alt={post.title}
            sx={{
              height: { xs: 260, md: "100%" },
              width: "100%",
              objectFit: "cover",
              transition: "transform 0.5s ease, filter 0.5s ease",
              "&:hover": {
                transform: "scale(1.05)",
                filter: "brightness(1.1)",
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
              pointerEvents: "none",
            }}
          />
        </Box>

        {/* Content Section */}
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            p: { xs: 4, md: 5 },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 1.5,
              fontWeight: 700,
              color: "hsl(var(--primary))",
              mb: 1.5,
              textTransform: "uppercase",
            }}
          >
            Featured Post
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              mb: 2,
              position: "relative",
              transition: "color 0.3s ease",
              "&:hover": {
                color: "hsl(var(--primary-foreground))",
                cursor: "pointer",
              },
              "&:after": {
                content: '""',
                position: "absolute",
                width: 0,
                height: 3,
                bottom: -6,
                left: 0,
                bgcolor: "hsl(var(--primary-foreground))",
                borderRadius: 2,
                transition: "width 0.3s ease",
              },
              "&:hover:after": {
                width: "40%",
              },
            }}
          >
            {post.title}
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{
              color: "hsl(var(--muted-foreground))",
              mb: 3,
              fontWeight: 600,
            }}
          >
            {date} · {post.author?.name ?? "Unknown author"}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "hsl(var(--foreground))",
              opacity: 0.85,
              lineHeight: 1.6,
              fontSize: "1.05rem",
            }}
          >
            {post.content.slice(0, 160)}...
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
}
