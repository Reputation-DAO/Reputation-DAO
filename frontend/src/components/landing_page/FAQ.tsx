
import { useState } from 'react';
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [
  {
    question: 'How is Reputation DAO different from typical reputation systems?',
    answer:
      'Reputation DAO is a decentralized, tamper-proof reputation layer built on the Internet Computer (ICP). Unlike traditional systems owned and controlled by centralized platforms, Reputation DAO ensures full transparency, censorship resistance, and verifiability. Users have cryptographic ownership of their reputation, and data is stored on-chain, not in opaque silos. No entity can modify, delete, or fabricate your reputation—only actions tied to your identity can affect it.',
  },
  {
    question: 'Can my reputation be transferred or sold?',
    answer:
      'No. Reputation within the DAO is soulbound, meaning it is intrinsically linked to your identity and cannot be transferred, sold, or manipulated for profit. This design prevents reputation farming, identity leasing, or reputation marketplaces, ensuring the integrity and authenticity of each individual’s social proof. It reinforces accountability and resists Sybil attacks.',
  },
  {
    question: 'What platforms can integrate Reputation DAO?',
    answer:
      'Reputation DAO is designed to be modular and interoperable. Any decentralized or centralized platform—whether it’s a DAO, DeFi protocol, decentralized marketplace, NFT platform, or even a Web2 site—can integrate the Reputation DAO protocol. The system provides APIs and SDKs that make integration seamless, allowing platforms to query user reputation scores and tailor access, trust levels, or benefits accordingly.',
  },
  {
    question: 'Is Reputation DAO open-source?',
    answer:
      'Yes. Reputation DAO is fully open-source under a permissive license, ensuring anyone can audit, contribute, or fork the protocol. The smart contracts, governance logic, scoring algorithms, and SDKs are all publicly available. Transparency is foundational to the project—it allows developers, users, and the broader ecosystem to verify that the protocol behaves exactly as described.',
  },
  {
    question: 'How does Reputation DAO handle privacy?',
    answer:
      'Reputation DAO balances transparency with user privacy through cryptographic methods such as zero-knowledge proofs and selective disclosure. While the scoring logic is public, sensitive user data is minimized or anonymized. Users can prove certain aspects of their reputation without revealing their full history. Future versions may include more advanced privacy-preserving mechanisms like ZK-SNARKs.',
  },
  {
    question: 'Can developers extend or build on top of Reputation DAO?',
    answer:
      'Absolutely. Reputation DAO is designed with extensibility in mind. Developers can create modules that plug into the core protocol, define custom scoring rules, or build new interfaces using the open APIs. You can also fork the core logic to suit your ecosystem’s unique needs. Whether you’re building a gated community, a credit system, or a merit-based rewards platform, the primitives are composable and developer-friendly.',
  },
  {
    question: 'Does Reputation DAO work with existing wallets and identities?',
    answer:
      'Yes. Reputation DAO is compatible with major blockchain wallets (like Plug, Stoic, MetaMask via Internet Identity bridges) and decentralized identity standards (like DIDs and Internet Identity). This makes it easy to authenticate users and link actions across ecosystems without compromising ownership. Integration is frictionless, with support for Web3 onboarding flows and identity resolvers.',
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
        py: { xs: 0, md: 0 },
        bgcolor: 'transparent',
      }}
    >
      <Container maxWidth="md" sx={{ px: 1 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '2.5rem' },
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            color: 'hsl(var(--foreground))',
            textAlign: 'center',
            mb: 6,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
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
                  borderColor: 'hsl(var(--foreground))',
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    sx={{
                      fontSize: 22,
                      color: 'hsl(var(--muted-foreground))',
                      transition: 'transform 0.2s ease',
                      '&.Mui-expanded': {
                        transform: 'rotate(180deg)',
                      },
                    }}
                  />
                }
                sx={{
                  '& .MuiAccordionSummary-content': {
                    margin: 0,
                    fontWeight: 600,
                    fontSize: '1.05rem',
                    color: 'hsl(var(--foreground))',
                  },
                  minHeight: 64,
                  px: 2,
                }}
              >

                {faq.question}
              </AccordionSummary>
              <AccordionDetails
              sx={{
                color: 'hsl(var(--muted-foreground))',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                px: 2,
                pb: 2,
              }}
            >

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
