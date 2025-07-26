// @ts-nocheck

import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
} from '@mui/material';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';



export default function BlogPage() {
  // Expanded content to fill all new sections of the blog
  const posts = [
    {
      id: 1,
      title: 'The Evolution of Reputation in Web3',
      snippet: 'From pseudonymous interactions to verifiable on-chain credentials, we explore the journey of digital reputation and its critical role in building trustless systems.',
      category: 'Reputation',
      date: 'July 25, 2025',
      author: { name: 'Elena Petrova', avatar: '/avatars/elena.jpg' },
      image: 'https://images.unsplash.com/photo-1639762681057-408e52192e50?auto=format&fit=crop&w=1200&q=80',
      isFeatured: true,
      views: 12800,
    },
    {
      id: 2,
      title: 'Governance Models for DAOs: Beyond Token Voting',
      snippet: 'Is one-token-one-vote truly democratic? We analyze emerging governance models that prioritize reputation, contribution, and expertise.',
      category: 'Governance',
      date: 'July 18, 2025',
      author: { name: 'Kenji Tanaka', avatar: '/avatars/kenji.jpg' },
      image: 'https://images.unsplash.com/photo-1642104704074-907126278d45?auto=format&fit=crop&w=800&q=80',
      isEditorsPick: true,
      views: 9400,
    },
    {
      id: 3,
      title: 'On-Chain Identity: A New Paradigm for Digital Self',
      snippet: 'Discover how decentralized identifiers (DIDs) and verifiable credentials (VCs) are creating a future where you own your digital identity.',
      category: 'Identity',
      date: 'July 11, 2025',
      author: { name: 'Aisha Khan', avatar: '/avatars/aisha.jpg' },
      image: 'https://images.unsplash.com/photo-1639762682392-922af238c434?auto=format&fit=crop&w=800&q=80',
      views: 15200,
    },
    {
      id: 4,
      title: 'Reputation DAO: Project Update Q2 2025',
      snippet: 'A look back at our progress in the second quarter, including new protocol integrations, community growth, and our roadmap for Q3.',
      category: 'Project Update',
      date: 'July 01, 2025',
      author: { name: 'David Chen', avatar: '/avatars/david.jpg' },
      image: 'https://images.unsplash.com/photo-1640955033333-909d7a22a36b?auto=format&fit=crop&w=800&q=80',
      views: 7600,
    },
    {
      id: 5,
      title: 'Building on the Internet Computer Protocol (ICP)',
      snippet: 'A developer\'s deep dive into the technical architecture of ICP and how it enables fully on-chain web services.',
      category: 'ICP',
      date: 'June 24, 2025',
      author: { name: 'Elena Petrova', avatar: '/avatars/elena.jpg' },
      image: 'https://images.unsplash.com/photo-1634732310249-131c3c583955?auto=format&fit=crop&w=800&q=80',
      views: 11500,
    },
  ];

   const featuredPost = posts.find((p) => p.isFeatured);
  const editorsPick = posts.find((p) => p.isEditorsPick);
  const latestPosts = posts.filter((p) => !p.isFeatured && !p.isEditorsPick);
  const popularPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 3);

  return (
    <Box sx={{ bgcolor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', py: 8 }}>
      <Container maxWidth="lg">
        {/* HERO SECTION */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4,
            p: { xs: 3, md: 6 }, mb: 8, borderRadius: 'var(--radius)',
            bgcolor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-1px', color: 'hsl(var(--foreground))', mb: 1 }}>
              Insights from the Edge
            </Typography>
            <Typography sx={{ fontSize: '1.1rem', color: 'hsl(var(--muted-foreground))' }}>
              Updates, ideas, and innovations on decentralized trust, identity, and Web3 communities.
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={5}>
          {/* MAIN CONTENT */}
          <Grid item xs={12} md={8} component="div">
            {/* Featured Post */}
            {featuredPost && (
              <Box sx={{ mb: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2, borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)',
                    bgcolor: 'hsl(var(--muted))',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 'var(--shadow-lg)' },
                  }}
                >
                  <Box sx={{ height: 300, borderRadius: 'var(--radius)', bgcolor: 'hsl(var(--background))', mb: 2.5, overflow: 'hidden' }}>
                    <img src={featuredPost.image} alt={featuredPost.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  <Box sx={{ px: 1 }}>
                    <Chip label={featuredPost.category} size="small" sx={{ bgcolor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', mb: 1.5 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5, color: 'hsl(var(--foreground))' }}>{featuredPost.title}</Typography>
                    <Typography variant="body1" sx={{ color: 'hsl(var(--muted-foreground))', mb: 2.5 }}>{featuredPost.snippet}</Typography>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* Latest Posts Grid */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {latestPosts.map((post) => (
                <Grid item component="div" xs={12} sm={6} md={4} lg={3} xl={2} key={post.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      display: 'flex', flexDirection: 'column', height: '100%', width: '350px',
                      p: 2, bgcolor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 'var(--shadow-lg)' },
                    }}
                  >
                    <Box sx={{ height: 160, borderRadius: 'var(--radius)', bgcolor: 'hsl(var(--background))', mb: 2, overflow: 'hidden' }}>
                      <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Box sx={{ px: 1, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <Chip label={post.category} size="small" sx={{ bgcolor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))', width: 'fit-content', mb: 1.5 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1, mb: 2, color: 'hsl(var(--foreground))' }}>{post.title}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Editor's Pick */}
            {editorsPick && (
              <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'hsl(var(--foreground))' }}>Editor's Pick</Typography>
                <Paper variant="outlined" sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, p: 2, bgcolor: 'hsl(var(--muted))', borderRadius: 'var(--radius)', borderColor: 'hsl(var(--border))' }}>
                  <Box sx={{ width: { xs: '100%', sm: '200px' }, height: { xs: 150, sm: 'auto' }, flexShrink: 0, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <img src={editorsPick.image} alt={editorsPick.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{editorsPick.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', my: 1, flexGrow: 1 }}>{editorsPick.snippet}</Typography>
                    <Button endIcon={<ArrowForwardIcon />} sx={{ justifyContent: 'flex-start', p: 0, color: 'hsl(var(--primary))', '&:hover': { bgcolor: 'transparent' } }}>Read More</Button>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* CTA Section */}
            <Paper sx={{ p: 4, mb: 6, textAlign: 'center', bgcolor: 'hsl(var(--primary))', borderRadius: 'var(--radius)' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'hsl(var(--primary-foreground))' }}>Ready to build the future of trust?</Typography>
              <Typography sx={{ color: 'hsl(var(--primary-foreground) / 0.8)', my: 1 }}>Join our community of developers and researchers.</Typography>
              <Button variant="contained" sx={{ mt: 2, bgcolor: 'hsl(var(--primary-foreground))', color: 'hsl(var(--primary))', '&:hover': { bgcolor: 'hsl(var(--background) / 0.9)' } }}>Get Involved</Button>
            </Paper>

            {/* Popular Posts */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'hsl(var(--foreground))' }}>Popular Posts</Typography>
              {popularPosts.map((post, index) => (
                <Box key={post.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--border))' }}>0{index + 1}</Typography>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{post.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>By {post.author.name} • {post.category}</Typography>
                    </Box>
                  </Box>
                  {index < popularPosts.length - 1 && <Divider sx={{ borderColor: 'hsl(var(--border))' }} />}
                </Box>
              ))}
            </Box>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 6 }}>
              {[1, 2, 3, '...'].map((page, idx) => (
                <Button
                  key={idx}
                  variant={page === 1 ? 'contained' : 'outlined'}
                  sx={{
                    minWidth: 40, height: 40, borderRadius: 'var(--radius)',
                    bgcolor: page === 1 ? 'hsl(var(--primary))' : 'transparent',
                    color: page === 1 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    borderColor: 'hsl(var(--border))',
                  }}
                >
                  {page}
                </Button>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}