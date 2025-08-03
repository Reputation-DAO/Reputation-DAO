import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import SchemaIcon from '@mui/icons-material/Schema';
import DesignServicesIcon from '@mui/icons-material/DesignServices';

const resources = [
  {
    label: 'GitHub',
    href: 'https://github.com/Reputation-DAO/Reputation-DAO',
    icon: <GitHubIcon fontSize="medium" />,
  },
  {
    label: 'Core Idea',
    href: 'https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0',
    icon: <LightbulbIcon fontSize="medium" />,
  },
  {
    label: 'Watch Demo',
    href: 'https://www.youtube.com/watch?v=f5_kVgIzl_E',
    icon: <PlayCircleOutlineIcon fontSize="medium" />,
  },
  {
    label: 'Presentation',
    href: 'https://www.canva.com/design/DAGt5PFilsg/SE7k5cKSesAPZNCN7EikaQ/edit',
    icon: <SlideshowIcon fontSize="medium" />,
  },
  {
    label: 'Complete Flow chart',
    href: 'https://www.figma.com/board/fWhXwD7MX9wxylm8SumTqr/REPUTAION-DAO-WORKFLOW?t=xV8nwU4sJ0ZQSwEq-0',
    icon: <SchemaIcon fontSize="medium" />,
  },
  {
    label: 'Figma Link',
    href: 'https://www.figma.com/design/1Qwqc7fWOyigkncoVoSiPH/REPUTATION-DAO?t=xV8nwU4sJ0ZQSwEq-0',
    icon: <DesignServicesIcon fontSize="medium" />,
  },
];

export default function Resources() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 0, md: 0 },
        bgcolor: 'transparent',
      }}
    >
      <Container maxWidth="lg" sx={{ px: 3 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2.5rem', md: '3rem' },
            textAlign: 'center',
            color: 'hsl(var(--foreground))',
            mb: { xs: 3, md: 5 },
            letterSpacing: '-1px',
            lineHeight: 1.15,
            position: 'relative',
          }}
        >
          Resources
        </Typography>

        <Stack
          direction="row"
          justifyContent="center"
          flexWrap="wrap"
          spacing={2.5}
          useFlexGap
        >
          {resources.map((item, idx) => (
            <Button
              key={idx}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={item.icon}
              variant="outlined"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                borderRadius: '1rem',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                borderColor: 'hsl(var(--border))',
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                py: 1.75,
                fontSize: 15,
                boxShadow: '0 2px 6px hsl(var(--border) / 0.2)',
                transition: 'all 0.25s ease-in-out',
                '&:hover': {
                  backgroundColor: 'hsl(var(--background) / 0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 14px hsl(var(--border) / 0.4)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>

        <Box
          sx={{
            width: '100%',
            height: '1px',
            my: 10,
            background: 'linear-gradient(to right, transparent, hsl(var(--border)), transparent)',
          }}
        />
      </Container>
    </Box>
  );
}
