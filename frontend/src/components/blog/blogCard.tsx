import { Card, CardContent, CardMedia, Typography, Box } from "@mui/material";
import type { Post } from "../canister/blogBackend";

interface Props {
  post: Post;
}

export default function BlogCard({ post }: Props) {
  const date = new Date(Number(post.date) / 1_000_000).toLocaleDateString();

  return (
    <Card
      elevation={8}
      sx={{
        borderRadius: 3,
        overflow: "hidden", // no scroll anywhere
        cursor: "pointer",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        bgcolor: "hsl(var(--background))",
        borderColor: "hsl(var(--primary))",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          borderColor: "hsl(var(--foreground))",
        },
        width: 320,
        height: 320,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image container half height */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          height: "50%", // 160px fixed height
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

      {/* Content half height with no scroll */}
      <CardContent
        sx={{
          flexGrow: 1,
          p: 2,
          overflow: "hidden", // no scrollbars
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
            color: "text.primary",
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
          color="text.secondary"
          sx={{ display: "block", mb: 1, fontWeight: 600 }}
        >
          {date} &bull; {post.author?.name ?? "Unknown author"}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.4,
            fontSize: "0.9rem",
            userSelect: "text",
            whiteSpace: "normal",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 4, // show max 4 lines
            WebkitBoxOrient: "vertical",
          }}
        >
          {post.content}
        </Typography>
      </CardContent>
    </Card>
  );
}
