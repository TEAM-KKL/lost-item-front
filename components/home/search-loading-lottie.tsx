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
        type="module"
        src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs"
      />
      <div className="mt-8 flex flex-col items-center justify-center">
        <dotlottie-player
          src="/loading.lottie"
          autoplay
          loop
          mode="normal"
          style={{ width: "320px", maxWidth: "100%", height: "320px" }}
        />
      </div>
    </>
  );
}
