import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Skeleton,
  Divider,
  keyframes,
} from "@mui/material";
import HeroSection from "../components/blog/hero";
import FeaturedBlogCard from "../components/blog/Featured";
import LatestArticlesGrid from "../components/blog/LatestArticlesGrid";
import { blogActor } from "../components/canister/blogBackend";
import type { Post } from "../components/canister/blogBackend";

// Glow animation (same as LandingPage)
const heartbeatGlow = keyframes`
  0% { opacity: 0.06; filter: blur(25px); }
  20% { opacity: 0.14; filter: blur(40px); }
  50% { opacity: 0.36; filter: blur(50px); }
  80% { opacity: 0.14; filter: blur(40px); }
  100% { opacity: 0.06; filter: blur(25px); }
`;

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await blogActor.getPosts();
        const formatted = data.map((p) => ({
          ...p,
          status: Object.keys(p.status)[0] as "Draft" | "Published" | "Archived",
        }));
        setPosts(formatted);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featuredPost = posts.find((p) => p.isFeatured);
  const otherPosts = posts.filter((p) => !p.isFeatured);

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "hsl(var(--background))",
        minHeight: "100vh",
        overflow: "hidden",
        pb: 6,
      }}
    >
      {/* Left Glow */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100px",
          height: "100%",
          background: "hsl(var(--primary))",
          animation: `${heartbeatGlow} 10s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          borderRadius: "0 100px 100px 0",
        }}
      />
      {/* Right Glow */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "100px",
          height: "100%",
          background: "hsl(var(--primary))",
          animation: `${heartbeatGlow} 10s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          borderRadius: "100px 0 0 100px",
        }}
      />

      <HeroSection />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          py: { xs: 4, md: 6 }, // 32px on mobile, 48px on desktop
        }}
      >
        {/* Featured Section */}
        <FeaturedBlogCard loading={loading} post={featuredPost} />
        {/* Latest Articles */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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
            Latest Articles
          </Typography>
        </Box>


        <LatestArticlesGrid loading={loading} posts={otherPosts} />
      </Container>
    </Box>
  );
}
