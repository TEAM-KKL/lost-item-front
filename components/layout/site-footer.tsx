const footerLinks = [
  "Terms of Service",
  "Privacy Policy",
  "Contact Support",
  "About Us",
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-8 py-12 md:flex-row">
        <p className="text-xs text-slate-500">
          © 2024 FoundIt Korea. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {footerLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs text-slate-500 transition-colors hover:text-primary"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
