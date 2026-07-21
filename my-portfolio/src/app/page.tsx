import FloatingNav from "@/components/FloatingNav";
import Hero from "@/components/Hero";
import WorkSection from "@/components/WorkSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ResumeSection from "@/components/ResumeSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <FloatingNav />
      <Hero />
      <WorkSection />
      <AboutSection />
      <ExperienceSection />
      <ResumeSection />
      <Footer />
    </main>
  );
}
