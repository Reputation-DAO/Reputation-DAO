import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ProblemSolutionSection from "@/components/sections/ProblemSolutionSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import UseCasesSection from "@/components/sections/UseCasesSection";
import TechnicalSection from "@/components/sections/TechnicalSection";
import ResourcesSection from "@/components/sections/ResourcesSection";
import FAQSection from "@/components/sections/FAQSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <BenefitsSection />
        <UseCasesSection />
        <TechnicalSection />
        <ResourcesSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;