import { GridLegacy as Grid, Skeleton, Box } from "@mui/material";
import BlogCard from "./blogCard";
import type { Post } from "../canister/blogBackend";

interface LatestArticlesGridProps {
  loading: boolean;
  posts: Post[];
}

export default function LatestArticlesGrid({ loading, posts }: LatestArticlesGridProps) {
  return (
    <Box
      sx={{
        maxWidth: "1400px",
        mx: "auto",
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Grid
        container
        spacing={4}
        sx={{ mt: 2 }}
        justifyContent="center"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "stretch",
                }}
              >
                <Skeleton
                  variant="rectangular"
                  height={280}
                  sx={{
                    borderRadius: 3,
                    width: "100%",
                    maxWidth: 360,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
                  }}
                  animation="wave"
                />
              </Grid>
            ))
          : posts.map((post) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={post.id}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "stretch",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 360,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <BlogCard post={post} />
                </Box>
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}
