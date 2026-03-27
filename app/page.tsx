import { CtaSection } from "@/components/home/cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { RecentItemsSection } from "@/components/home/recent-items-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <RecentItemsSection />
      <CtaSection />
    </>
  );
}
