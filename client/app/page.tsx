import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Fleet from "@/components/home/Fleet";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import Services from "@/components/home/Services";
import Testimonials from "@/components/home/Testimonials";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Hero />
      <Services />
      <Fleet />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </main>
  );
}

