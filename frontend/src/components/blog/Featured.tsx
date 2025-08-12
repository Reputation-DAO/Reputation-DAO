import { Box, Typography, Skeleton } from "@mui/material";
import FeaturedBlogCard from "./featuredBlogCard";
import type { Post } from "../canister/blogBackend";

interface FeaturedSectionProps {
  loading: boolean;
  post?: Post;
}

export default function FeaturedSection({ loading, post }: FeaturedSectionProps) {
  return (
    <Box sx={{ mb: 8, position: "relative", zIndex: 1 }}>
      {/* Section Title */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Box
          sx={{
            width: 6,
            height: 28,
            borderRadius: 1,
            background: "hsl(var(--primary))",
            mr: 2,
          }}
        />
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: "hsl(var(--foreground))",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Featured
        </Typography>
      </Box>

      {/* Content */}
      {loading ? (
        <Skeleton
          variant="rectangular"
          height={400}
          animation="wave"
          sx={{
            borderRadius: 3,
            mb: 4,
            bgcolor: "hsl(var(--muted))",
          }}
        />
      ) : post ? (
        <FeaturedBlogCard post={post} />
      ) : (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          No featured post available.
        </Typography>
      )}

      {/* Divider */}
      <Box
        sx={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(to right, transparent, hsl(var(--border)), transparent)",
          my: 6,
        }}
      />
    </Box>
  );
}
