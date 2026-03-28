import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-headline text-2xl font-extrabold tracking-[-0.06em] text-primary transition-opacity hover:opacity-80"
        >
          FoundIt
        </Link>
        {/* Login button removed */}
      </div>
    </header>
  );
}
