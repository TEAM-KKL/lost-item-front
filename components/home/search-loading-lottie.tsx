"use client";

import Script from "next/script";

type SearchLoadingLottieProps = {
  visible: boolean;
};

export function SearchLoadingLottie({ visible }: SearchLoadingLottieProps) {
  if (!visible) {
    return null;
  }

  return (
    <>
      <Script
        src="https://unpkg.com/@lottiefiles/lottie-player@2.0.12/dist/lottie-player.js"
        strategy="afterInteractive"
      />
      <div className="pointer-events-none absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-[62%] flex-col items-center justify-center">
        <lottie-player
          src="/loading.json"
          autoplay
          loop
          background="transparent"
          speed="1"
          style={{ width: "260px", maxWidth: "100%", height: "260px" }}
        />
      </div>
    </>
  );
}
