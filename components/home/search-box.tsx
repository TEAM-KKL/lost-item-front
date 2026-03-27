"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import {
  type ChatMessage,
  SearchChatPanel,
} from "@/components/home/search-chat-panel";
import { SearchIcon } from "@/components/ui/icons";

type SearchBoxProps = {
  defaultQuery: string;
};

type ClarifyField = "item" | "location" | "detail";

type PromptConfig = {
  title: string;
  description: string;
  suggestions: string[];
  question: string;
};

const promptByField: Record<ClarifyField, PromptConfig> = {
  item: {
    title: "어떤 물건인지 먼저 알려주세요",
    description: "물건 종류가 있어야 비슷한 분실물을 우선 매칭할 수 있습니다.",
    suggestions: ["지갑이에요", "에어팟이에요", "열쇠예요"],
    question: "찾으시는 물건이 정확히 무엇인지 먼저 알려주세요.",
  },
  location: {
    title: "마지막으로 본 장소가 어디인가요?",
    description: "역 이름, 동네, 건물 이름처럼 좁혀질수록 결과가 더 정확해집니다.",
    suggestions: ["홍대입구역 근처", "강남역 2번 출구", "버스 안에서"],
    question: "좋아요. 마지막으로 본 위치를 한 군데만 알려주세요.",
  },
  detail: {
    title: "특징을 하나만 더 알려주세요",
    description: "색상, 재질, 브랜드, 케이스 유무 같은 단서가 있으면 매칭률이 크게 올라갑니다.",
    suggestions: [
      "검은 가죽이에요",
      "브랜드 로고가 있어요",
      "케이스 없이 본체만 있어요",
    ],
    question: "마지막으로 색상이나 재질, 브랜드 같은 특징을 하나만 더 알려주세요.",
  },
};

const itemPattern =
  /(지갑|카드지갑|반지갑|장지갑|가방|백팩|열쇠|에어팟|이어폰|휴대폰|핸드폰|아이패드|노트북|우산|가디건|학생증|신분증)/;
const locationPattern =
  /(역|출구|입구|동|로|길|거리|공원|카페|학교|정류장|터미널|버스|지하철|편의점|백화점|캠퍼스|한강|광장|건물)/;
const detailPattern =
  /(검|흰|하얀|블랙|화이트|실버|은색|가죽|천|브랜드|로고|케이스|프로|맥세이프|줄무늬|무광|유광|파랑|빨강|갈색|네이비)/;

function assessQuery(query: string) {
  const normalized = query.trim();

  return {
    missingFields: [
      !itemPattern.test(normalized) ? "item" : null,
      !locationPattern.test(normalized) ? "location" : null,
      !detailPattern.test(normalized) ? "detail" : null,
    ].filter(Boolean) as ClarifyField[],
  };
}

function createMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return {
    id: `${role}-${text}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    role,
    text,
  };
}

function buildSearchQuery(
  baseQuery: string,
  answers: Partial<Record<ClarifyField, string>>,
) {
  return [baseQuery.trim(), answers.item, answers.location, answers.detail]
    .filter(Boolean)
    .join(", ");
}

export function SearchBox({ defaultQuery }: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [missingFields, setMissingFields] = useState<ClarifyField[]>([]);
  const [answers, setAnswers] = useState<Partial<Record<ClarifyField, string>>>(
    {},
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentPrompt = missingFields[0] ? promptByField[missingFields[0]] : null;
  const summaryQuery = useMemo(
    () => buildSearchQuery(query, answers),
    [answers, query],
  );
  const trackHref = `/search?q=${encodeURIComponent(summaryQuery)}#track-search`;

  function navigateToSearch(nextQuery: string) {
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
    });
  }

  function resetChat() {
    setDraftAnswer("");
    setAnswers({});
    setMessages([]);
    setMissingFields([]);
  }

  function openClarifyFlow(nextMissingFields: ClarifyField[]) {
    const firstPrompt = promptByField[nextMissingFields[0]];

    setIsChatOpen(true);
    setDraftAnswer("");
    setAnswers({});
    setMissingFields(nextMissingFields);
    setMessages([createMessage("assistant", firstPrompt.question)]);
  }

  function handleSubmitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextQuery = query.trim();
    if (!nextQuery) {
      return;
    }

    const assessment = assessQuery(nextQuery);

    if (assessment.missingFields.length === 0) {
      resetChat();
      setIsChatOpen(false);
      navigateToSearch(nextQuery);
      return;
    }

    openClarifyFlow(assessment.missingFields);
  }

  function handleSubmitAnswer(rawValue?: string) {
    const answer = (rawValue ?? draftAnswer).trim();
    const currentField = missingFields[0];

    if (!answer || !currentField) {
      return;
    }

    const remainingFields = missingFields.slice(1);
    const nextAnswers = {
      ...answers,
      [currentField]: answer,
    };
    const nextMessages = [...messages, createMessage("user", answer)];

    if (remainingFields.length === 0) {
      setAnswers(nextAnswers);
      setMissingFields([]);
      setMessages([
        ...nextMessages,
        createMessage(
          "assistant",
          `좋아요. "${buildSearchQuery(query, nextAnswers)}" 기준으로 바로 찾아볼 수 있어요.`,
        ),
      ]);
      setDraftAnswer("");
      return;
    }

    const nextPrompt = promptByField[remainingFields[0]];

    setAnswers(nextAnswers);
    setMissingFields(remainingFields);
    setMessages([
      ...nextMessages,
      createMessage("assistant", nextPrompt.question),
    ]);
    setDraftAnswer("");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form onSubmit={handleSubmitSearch}>
        <div
          className={`rounded-[1.4rem] border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-[0_10px_30px_rgba(0,35,111,0.06)] transition-all duration-500 ${
            isChatOpen
              ? "shadow-[0_22px_60px_rgba(0,35,111,0.1)] ring-2 ring-primary/10"
              : "focus-within:ring-2 focus-within:ring-primary/20"
          }`}
        >
          <div className="flex items-center gap-3 px-4">
            <SearchIcon className="h-5 w-5 text-outline" />
            <input
              type="text"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 검은 가죽 지갑, 홍대입구"
              className="w-full bg-transparent py-4 text-lg text-on-surface outline-none placeholder:text-outline-variant"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary/80">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          지금도 계속 찾고 있습니다
        </div>

        <div className="mt-8 flex flex-col justify-center gap-4 md:flex-row">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-10 py-4 text-lg font-extrabold text-on-primary transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-70"
          >
            {isPending ? "검색 중..." : "검색하기"}
          </button>
          <Link
            href={trackHref}
            className="rounded-lg border-2 border-primary/20 bg-primary/10 px-10 py-4 text-lg font-extrabold text-primary transition-colors transition-transform hover:bg-primary/15 active:scale-95"
          >
            계속 찾아줘
          </Link>
        </div>
      </form>

      <SearchChatPanel
        isOpen={isChatOpen}
        messages={messages}
        draftAnswer={draftAnswer}
        currentPrompt={currentPrompt ?? undefined}
        summaryQuery={missingFields.length === 0 ? summaryQuery : undefined}
        isNavigating={isPending}
        onDraftAnswerChange={setDraftAnswer}
        onSubmitAnswer={() => handleSubmitAnswer()}
        onSuggestionSelect={handleSubmitAnswer}
        onSearchNow={() => navigateToSearch(summaryQuery)}
        onClose={() => {
          resetChat();
          setIsChatOpen(false);
        }}
      />
    </div>
  );
}
