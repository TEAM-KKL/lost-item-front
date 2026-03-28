import { NextResponse } from "next/server";
import { searchLostItemsByText } from "@/lib/lost-items-search";

type SearchRouteRequestBody = {
  query?: string;
  sessionId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchRouteRequestBody;
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json(
        { message: "검색어가 필요합니다." },
        { status: 400 },
      );
    }

    const result = await searchLostItemsByText(query, body.sessionId);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "검색 요청을 처리하지 못했습니다." },
      { status: 500 },
    );
  }
}
