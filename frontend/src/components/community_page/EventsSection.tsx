import { Box, Typography, Paper, Button } from "@mui/material";
import { CalendarDays } from "lucide-react";
import type { FC } from "react";

const events = [
  {
    title: "DAO Governance Call",
    date: "Nov 7, 2025",
    description:
      "Monthly community governance discussion & proposal review.",
    link: "#",
  },
  {
    title: "Smart Contract Workshop",
    date: "Nov 14, 2025",
    description:
      "Hands-on session for developers on DAO contract architecture.",
    link: "#",
  },
  {
    title: "Community Onboarding Session",
    date: "Nov 21, 2025",
    description:
      "Live walkthrough for new members to explore DAO tools, governance, and opportunities.",
    link: "#",
  },
  {
    title: "Tokenomics Deep Dive",
    date: "Nov 28, 2025",
    description:
      "Expert-led webinar unpacking DAO token distribution, staking models, and incentives.",
    link: "#",
  },
  {
    title: "Quarterly DAO Town Hall",
    date: "Dec 12, 2025",
    description:
      "Leadership team shares key updates, roadmap progress, and answers community questions.",
    link: "#",
  },
];

const EventsSection: FC = () => {
  return (
    <Box sx={{ mb: 14 }}>
      <Typography
        variant="h2"
        sx={{
          fontWeight: 700,
          textAlign: "center",
          mb: 2,
          color: "hsl(var(--foreground))",
        }}
      >
        Events & Webinars
      </Typography>
      <Typography
        sx={{
          textAlign: "center",
          color: "hsl(var(--muted-foreground))",
          maxWidth: 600,
          mx: "auto",
          mb: 6,
        }}
      >
        Join our upcoming events to connect, learn, and share with other
        members of the DAO.
      </Typography>

      {/* Horizontal scroll container */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          px: 2,
          py: 1,
          "&::-webkit-scrollbar": {
            height: 8,
          },
          "&::-webkit-scrollbar-thumb": {
            background: "hsl(var(--primary) / 0.4)",
            borderRadius: 4,
          },
        }}
      >
        {events.map((event, idx) => (
          <Paper
            key={idx}
            sx={{
              flex: "0 0 auto",
              width: 360,
              height: 260,
              p: 3,
              display: "flex",
              color: "hsl(var(--foreground))",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: "var(--radius)",
              background: "hsl(var(--muted) / 0.15)",
              border: "var(--glass-border)",
              backdropFilter: "var(--glass-blur)",
              transition: "var(--transition-smooth)",
              position: "relative",
              overflow: "hidden",
              scrollSnapAlign: "start",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px hsl(var(--primary) / 0.25)",
                border: "1px solid hsl(var(--primary))",
                backgroundImage:
                  "radial-gradient(hsl(var(--primary) / 0.08) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
                background: "hsl(var(--background))",
              },
            }}
          >
            {/* Date badge */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "hsl(var(--primary) / 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarDays size={16} color="hsl(var(--primary))" />
              </Box>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  background: "hsl(var(--primary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {event.date}
              </Typography>
            </Box>

            {/* Title */}
            <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
              {event.title}
            </Typography>

            {/* Description */}
            <Typography
              sx={{
                color: "hsl(var(--muted-foreground))",
                fontSize: 13,
                flexGrow: 1,
                mt: 0.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {event.description}
            </Typography>

            {/* CTA */}
            <Button
              variant="outlined"
              href={event.link}
              sx={{
                borderColor: "hsl(var(--primary))",
                color: "hsl(var(--primary))",
                mt: 2,
                alignSelf: "flex-start",
                textTransform: "none",
                fontSize: 13,
                "&:hover": {
                  background: "hsl(var(--primary) / 0.08)",
                },
              }}
            >
              Learn More
            </Button>
          </Paper>
        ))}
      </Box>

      {/* Divider */}
      <Box
        sx={{
          width: "100%",
          height: "1px",
          my: 8,
          background:
            "linear-gradient(to right, transparent, hsl(var(--border)), transparent)",
        }}
      />
    </Box>
  );
};

export default EventsSection;
