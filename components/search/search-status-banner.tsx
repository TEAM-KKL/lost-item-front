import Image from "next/image";

type SearchStatusBannerProps = {
  assistantMessage?: string | null;
};

export function SearchStatusBanner({ assistantMessage }: SearchStatusBannerProps) {
  if (!assistantMessage) {
    return null;
  }

  return (
    <section className="mx-auto mb-8 max-w-7xl px-8">
      <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-[0_18px_42px_rgba(25,28,30,0.06)]">
        <div className="flex items-center">
          <Image
            src="/logo.svg"
            alt="찾았독"
            width={112}
            height={30}
            className="h-8 w-auto"
          />
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface">
          {assistantMessage}
        </p>
      </div>
    </section>
  );
}
