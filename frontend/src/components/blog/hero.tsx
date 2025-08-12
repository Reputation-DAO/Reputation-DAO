import { Box, Paper, Typography, Button } from "@mui/material";

export default function HeroSection(): JSX.Element {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 0,
        border: "none",
        borderBottom: "1px solid hsl(var(--border))",
        overflow: "hidden",
        bgcolor: "hsl(var(--background))",
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: "500px", // responsive height
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
              href="https://patreon.com/yourpage"
              target="_blank"
            >
              Help Us on Patreon
            </Button>
            <Button
              variant="outlined"
              sx={{
                borderColor: "white",
                color: "white",
                fontWeight: 600,
                px: 3,
                py: 1.2,
                "&:hover": {
                  borderColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary))",
                },
              }}
              href="/blog"
            >
              Read Our Latest Post
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
