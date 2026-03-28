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
      <div className="mt-8 flex flex-col items-center justify-center">
        <lottie-player
          src="/loading.json"
          autoplay
          loop
          background="transparent"
          speed="1"
          style={{ width: "320px", maxWidth: "100%", height: "320px" }}
        />
      </div>
    </>
  );
}
