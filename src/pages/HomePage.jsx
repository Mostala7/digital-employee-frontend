import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Features from "../components/Features";
import SolutionProcess from "../components/SolutionProcess";
import AIFeatures from "../components/AIFeatures";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import "../App.css"; // Reuse App CSS for global background decorations

const HomePage = () => {
  return (
    <>
      <div className="app-container">
        {/* Background decorations mapped from App.css */}
        <div className="bg-decoration shape-1"></div>
        <div className="bg-decoration shape-2"></div>

        <div className="first-viewport">
          <Navbar />

          <main className="main-content">
            <Hero />
            <Stats />
          </main>
        </div>

        <Features />
        <SolutionProcess />
        <AIFeatures />
        <Pricing />
        <CTA />
        <FAQ />
      </div>
      <Footer />
    </>
  );
};

export default HomePage;
