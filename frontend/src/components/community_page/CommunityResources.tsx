import { Grid, Paper, Typography ,Box} from '@mui/material';
import { Code2, FileText, HelpCircle, ShieldCheck } from 'lucide-react';
import { ReactNode } from 'react';

interface LinkItem {
  icon: ReactNode;
  label: string;
  href: string;
}

const linkItems: LinkItem[] = [
  { icon: <FileText size={26} />, label: 'Docs', href: '/docs' },
  { icon: <Code2 size={26} />, label: 'GitHub', href: 'https://github.com/Reputation-DAO/Reputaion-DAO' },
  { icon: <FileText size={26} />, label: 'Blog', href: '/blog' },
  { icon: <HelpCircle size={26} />, label: 'FAQ', href: '/' },
  { icon: <ShieldCheck size={26} />, label: 'Core Idea', href: 'https://docs.google.com/document/d/...' },
];

export default function CommunityResources(): JSX.Element {
  return (
    <>
    <Typography
        variant="h2"
        sx={{
          fontWeight: 700,
          textAlign: 'center',
          mb: 2,
          color: 'hsl(var(--foreground))',
          py:3,
        }}
      >
      Community Resources
    </Typography>



      <Grid container spacing={3} justifyContent="center" sx={{ mb: 14 }}>
        {linkItems.map((item, idx) => (
          <Grid item xs={6} sm={4} md={2} key={idx}>
            <a
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Paper
  sx={{
    width: 140, // Fixed width in px (you can tweak)
    aspectRatio: '1 / 1', // Keeps it square
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color:'hsl(var(--foreground))',
    gap: 1.5,
    background: 'hsl(var(--muted) / 0.2)',
    
    border: 'var(--glass-border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    px: 2,
    py: 2,
    '& svg': {
      transition: 'transform var(--transition-fast)',
      fontSize: '2rem', // Bigger icons
    },
    '&:hover': {
      background: 'hsl(var(--background))',
      boxShadow: '0 8px 24px hsl(var(--primary) / 0.2)',
      transform: 'translateY(-3px)',
      border: '1px solid hsl(var(--primary))',
      '& svg': {
        transform: 'scale(1.15)',
        color: 'hsl(var(--primary))',

      },
    },
  }}
>
  {item.icon}
  <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
    {item.label}
  </Typography>
</Paper>

            </a>
          </Grid>
        ))}

      </Grid>
      <Box
          sx={{
            width: '100%',
            height: '1px',
            my: 8,
            background: 'linear-gradient(to right, transparent, hsl(var(--border)), transparent)',
          }}
        />
    </>
  );
}
