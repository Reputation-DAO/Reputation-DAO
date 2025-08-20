
import { GridLegacy as Grid, Paper, Typography, Box } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import SchemaIcon from "@mui/icons-material/Schema";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import type { FC } from "react";

const linkItems = [
  {
    label: "GitHub",
    href: "https://github.com/Reputation-DAO/Reputation-DAO",
    icon: <GitHubIcon fontSize="medium" />,
  },
  {
    label: "Core Idea",
    href: "https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0",
    icon: <LightbulbIcon fontSize="medium" />,
  },
  {
    label: "Watch Demo",
    href: "https://www.youtube.com/watch?v=f5_kVgIzl_E",
    icon: <PlayCircleOutlineIcon fontSize="medium" />,
  },
  {
    label: "Presentation",
    href: "https://drive.google.com/file/d/18A6LH4TseJolKCbDPOf7et7IXwCj2fs0/view?usp=sharing",
    icon: <SlideshowIcon fontSize="medium" />,
  },
  {
    label: "Complete Flow chart",
    href: "https://www.figma.com/board/fWhXwD7MX9wxylm8SumTqr/REPUTAION-DAO-WORKFLOW?t=xV8nwU4sJ0ZQSwEq-0",
    icon: <SchemaIcon fontSize="medium" />,
  },
  {
    label: "Figma Link",
    href: "https://www.figma.com/design/1Qwqc7fWOyigkncoVoSiPH/REPUTATION-DAO?t=xV8nwU4sJ0ZQSwEq-0",
    icon: <DesignServicesIcon fontSize="medium" />,
  },
];

const CommunityResources: FC = () => {
  return (
    <>
      <Typography
        variant="h2"
        sx={{
          fontWeight: 700,
          textAlign: "center",
          mb: 2,
          color: "hsl(var(--foreground))",
          py: 3,
        }}
      >
        Community Resources
      </Typography>


      <Grid container spacing={3} justifyContent="center" sx={{ mb: 14 }}>
        {linkItems.map((item, idx) => (
          <Grid item xs={6} sm={4} md={2} key={idx}>
            <a
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Paper
                sx={{
                  width: 140,
                  aspectRatio: "1 / 1",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "hsl(var(--foreground))",
                  gap: 1.5,
                  background: "hsl(var(--muted) / 0.2)",
                  border: "var(--glass-border)",
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                  transition: "var(--transition-smooth)",
                  px: 2,
                  py: 2,
                  "& svg": {
                    transition: "transform var(--transition-fast)",
                    fontSize: "2rem",
                  },
                  "&:hover": {
                    background: "hsl(var(--background))",
                    boxShadow: "0 8px 24px hsl(var(--primary) / 0.2)",
                    transform: "translateY(-3px)",
                    border: "1px solid hsl(var(--primary))",
                    "& svg": {
                      transform: "scale(1.15)",
                      color: "hsl(var(--primary))",
                    },
                  },
                }}
              >
                {item.icon}
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Typography>
              </Paper>
            </a>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          width: "100%",
          height: "1px",
          my: 8,
          background:
            "linear-gradient(to right, transparent, hsl(var(--border)), transparent)",
        }}
      />
    </>
  );
};

export default CommunityResources;
