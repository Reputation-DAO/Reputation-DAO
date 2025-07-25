

import Hero from '../components/landing_page/Hero';
import ProblemSolution from '../components/landing_page/ProblemSolution';
import HowItWorks from '../components/landing_page/HowitWorks';
import KeyFeatures from '../components/landing_page/KeyFeatures';
import UseCases from '../components/landing_page/UseCases';
import TechnicalOverview from '../components/landing_page/TechnicalOverview';
import Resources from '../components/landing_page/Resources';
import FAQ from '../components/landing_page/FAQ';


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">

      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <KeyFeatures />
        <UseCases />
        <TechnicalOverview />
        <Resources />
        <FAQ />
      </main>

    </div>
  );
}
