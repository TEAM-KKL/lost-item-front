"use client";

import Script from "next/script";

type SearchLoadingLottieProps = {
  visible: boolean;
};

export function SearchLoadingLottie({ visible }: SearchLoadingLottieProps) {
  return (
    <>
      <Script
        src="https://unpkg.com/@lottiefiles/lottie-player@2.0.12/dist/lottie-player.js"
        strategy="afterInteractive"
      />
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          visible
            ? "mb-2 max-h-[18rem] opacity-100"
            : "mb-0 max-h-0 opacity-0"
        }`}
      >
        <div
          className={`flex items-center justify-center transition-transform duration-500 ease-out ${
            visible ? "translate-y-0" : "-translate-y-10"
          }`}
        >
          <lottie-player
            src="/loading.json"
            autoplay
            loop
            background="transparent"
            speed="1"
            style={{ width: "260px", maxWidth: "100%", height: "260px" }}
          />
        </div>
      </div>
    </>
  );
}
