import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CapabilitiesGrid from "@/components/CapabilitiesGrid";
import TechSection from "@/components/TechSection";
import TrustStrip from "@/components/TrustStrip";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <section id="capabilities">
          <CapabilitiesGrid />
        </section>
        <section id="technology">
          <TechSection />
        </section>
        <section id="compliance">
          <TrustStrip />
        </section>
        <section id="contact">
          <Footer />
        </section>
      </main>
    </div>
  );
};

export default Index;
