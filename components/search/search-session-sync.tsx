"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SearchSessionSyncProps = {
  sessionId?: string | null;
};

export function SearchSessionSync({ sessionId }: SearchSessionSyncProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!sessionId || searchParams.get("sid") === sessionId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sid", sessionId);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, sessionId]);

  return null;
}
