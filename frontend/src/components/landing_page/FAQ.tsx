
import { useState } from 'react';
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [
  {
    question: 'How is Reputation DAO different from typical reputation systems?',
    answer:
      'Reputation DAO is decentralized, tamper-proof, and built on ICP. Unlike centralized reputation systems, it ensures transparency, security, and ownership by the user.',
  },
  {
    question: 'Can my reputation be transferred or sold?',
    answer:
      'No. Reputation is soulbound and tied to your identity. It cannot be transferred, sold, or gamed.',
  },
  {
    question: 'What platforms can integrate Reputation DAO?',
    answer:
      'Any platform seeking transparent, decentralized reputation mechanisms — DAOs, DeFi protocols, social platforms, and beyond.',
  },
  {
    question: 'Is Reputation DAO open-source?',
    answer:
      'Yes. All core components of Reputation DAO are open-source, ensuring transparency and fostering community contributions.',
  },
  {
    question: 'How does Reputation DAO handle privacy?',
    answer:
      'Reputation DAO focuses on transparency while respecting user privacy through cryptographic proofs and on-chain data minimization.',
  },
  {
    question: 'Can developers extend or build on top of Reputation DAO?',
    answer:
      'Absolutely. Reputation DAO provides composable primitives for developers to integrate and extend within their own decentralized applications.',
  },
  {
    question: 'Does Reputation DAO work with existing wallets and identities?',
    answer:
      'Yes. Reputation DAO is designed to integrate seamlessly with existing blockchain wallets and decentralized identity solutions.',
  },
];


export default function FAQ() {
  const [expanded, setExpanded] = useState<number | false>(false);

  const handleChange = (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 5, md: 7 },
        bgcolor: 'hsl(var(--background))',
      }}
    >
      <Container maxWidth="md" sx={{ px: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.8rem', md: '2rem' },
            color: 'hsl(var(--foreground))',
            textAlign: 'center',
            mb: 8,
          }}
        >
          Frequently Asked Questions
        </Typography>

        <Box>
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              expanded={expanded === index}
              onChange={handleChange(index)}
              disableGutters
              sx={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                mb: 2,
                boxShadow: 'none',
                '&:before': {
                  display: 'none',
                },
                '&:hover': {
                  borderColor: 'hsl(var(--foreground) / 0.15)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20, color: 'hsl(var(--muted-foreground))' }} />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    margin: 0,
                    fontWeight: 500,
                    color: 'hsl(var(--foreground))',
                  },
                  minHeight: 56,
                }}
              >
                {faq.question}
              </AccordionSummary>
              <AccordionDetails sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, lineHeight: 1.7 }}>
                {faq.answer}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
      <Box
      sx={{
        width: '100%',
        height: '1px',
        my: 4,
        background: 'linear-gradient(to right, transparent, hsl(var(--border)), transparent)',
      }}
    />
    </Box>
  );
}
