import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
        >
          <Image
            src="/logo.svg"
            alt="FoundIt"
            width={140}
            height={38}
            priority
            className="h-10 w-auto"
          />
        </Link>
        {/* Login button removed */}
      </div>
    </header>
  );
}
