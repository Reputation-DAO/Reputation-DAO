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

const HomePage = () => {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-20">
        <Navigation />
      </div>
      <main className="relative z-10">
        <HeroSection />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <BenefitsSection />
        <UseCasesSection />
        <TechnicalSection />
        <ResourcesSection />
        <FAQSection />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
