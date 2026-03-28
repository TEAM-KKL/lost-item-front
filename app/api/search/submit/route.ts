import { NextResponse } from "next/server";
import { searchLostItems } from "@/lib/lost-items-search";
import { saveSearchResult } from "@/lib/search-result-cache";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const query = formData.get("query");
    const sessionId = formData.get("sessionId");
    const file = formData.get("file");

    const result = await searchLostItems({
      query: typeof query === "string" ? query : undefined,
      sessionId: typeof sessionId === "string" ? sessionId : undefined,
      image: file instanceof File ? file : null,
    });

    const token = saveSearchResult(result);

    return NextResponse.json({
      ...result,
      token,
    });
  } catch {
    return NextResponse.json(
      { message: "검색 요청을 처리하지 못했습니다." },
      { status: 500 },
    );
  }
}
