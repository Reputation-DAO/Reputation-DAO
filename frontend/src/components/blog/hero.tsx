import { Box, Paper, Typography, Button } from "@mui/material";
import type { FC } from "react";

const HeroSection: FC = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 0,
        border: "none",
        borderBottom: "1px solid hsl(var(--border))",
        overflow: "hidden",
        bgcolor: "hsl(var(--background))",
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: "500px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          px: 2,
          backgroundImage: `
            linear-gradient(
              rgba(0, 0, 0, 0.6),
              rgba(0, 0, 0, 0.4)
            ),
            url(/banner/blogBanner.jpg)
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: "white",
        }}
      >
        <Box sx={{ maxWidth: 700, px: 2 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              letterSpacing: "-0.5px",
              textShadow: "0 2px 10px rgba(0,0,0,0.4)",
            }}
          >
            Welcome to Our Blog
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.6,
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              mb: 4,
            }}
          >
            Insights, stories, and updates from our team.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: "hsl(var(--primary))",
                color: "white",
                fontWeight: 600,
                px: 3,
                py: 1.2,
              }}
              href="https://opencollective.com/reputation-dao"
              target="_blank"
            >
              Donate Us
            </Button>
            <Button variant="outlined" sx={{
              textTransform: 'none',
              px: 4, py: 1.2, fontSize: 13,
              borderRadius: 'var(--radius)',
              borderColor: 'hsl(var(--border))',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: 'hsl(var(--border))',
              },
              transition: 'var(--transition-smooth)',
            }}>
              Read Our Latest Post
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default HeroSection;
