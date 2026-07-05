import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Destinations } from "../components/Destinations";
import { Steps } from "../components/Steps";
import { Features } from "../components/Features";
import { Testimonials } from "../components/Testimonials";
import { CtaBanner } from "../components/Ctabaner";

/**
 * LandingPage
 * -------------------------------------------------------------
 * Each section below now lives in its own file under ./components,
 * with shared copy/colors/placeholders centralized in ./data.js.
 * This is the same design as before — the split just makes each
 * section independently readable and reusable:
 *
 *   Header       -> ./components/Header.jsx
 *   Hero         -> ./components/Hero.jsx        (full-bleed photo + search bar)
 *   Destinations -> ./components/Destinations.jsx (3 photo cards)
 *   Steps        -> ./components/Steps.jsx        (3-step "como funciona")
 *   Features     -> ./components/Features.jsx     (4-card grid)
 *   Testimonials -> ./components/Testimonials.jsx (carousel, useState)
 *   CtaBanner    -> ./components/CtaBanner.jsx    (closing dark banner)
 *
 * Fonts: add to your index.html <head> if not already present:
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
 * -------------------------------------------------------------
 */
export function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Destinations />
      <Steps />
      <Features />
      <Testimonials />
      <CtaBanner />
    </main>
  );
}

export default LandingPage;