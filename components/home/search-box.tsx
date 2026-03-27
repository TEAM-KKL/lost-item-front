"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  type ChatMessage,
  SearchChatPanel,
} from "@/components/home/search-chat-panel";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";

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

type SearchStage =
  | "idle"
  | "analyzing"
  | "matching"
  | "clarifying"
  | "ready"
  | "navigating";

type AttachedImage = {
  name: string;
  previewUrl: string;
};

const FIRST_BUBBLE_TARGET_Y_OFFSET = -6;

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

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function SearchBox({ defaultQuery }: SearchBoxProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRowRef = useRef<HTMLDivElement>(null);
  const statusRowRef = useRef<HTMLDivElement>(null);
  const firstUserBubbleRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const morphTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const morphStartRectRef = useRef<DOMRect | null>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [missingFields, setMissingFields] = useState<ClarifyField[]>([]);
  const [answers, setAnswers] = useState<Partial<Record<ClarifyField, string>>>(
    {},
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchStage, setSearchStage] = useState<SearchStage>("idle");
  const searchRunIdRef = useRef(0);
  const [isMorphingFirstBubble, setIsMorphingFirstBubble] = useState(false);
  const [morphBubble, setMorphBubble] = useState<{
    text: string;
    style: CSSProperties;
  } | null>(null);

  const currentPrompt = missingFields[0] ? promptByField[missingFields[0]] : null;
  const summaryQuery = useMemo(
    () => buildSearchQuery(query, answers),
    [answers, query],
  );
  const isStatusVisible =
    searchStage !== "idle" && searchStage !== "ready";
  const stageCopy =
    {
      idle: "",
      analyzing: "입력 내용을 분석 중이에요",
      matching: "분실물 데이터와 맞춰 보고 있어요",
      clarifying: "추가로 필요한 질문을 정리하고 있어요",
      ready: "",
      navigating: "검색 결과를 준비 중이에요",
    }[searchStage] || "";

  useEffect(() => {
    return () => {
      if (attachedImage) {
        URL.revokeObjectURL(attachedImage.previewUrl);
      }
    };
  }, [attachedImage]);

  function navigateToSearch(nextQuery: string) {
    setSearchStage("navigating");
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
    });
  }

  function resetChat() {
    searchRunIdRef.current += 1;
    if (morphTimeoutRef.current) {
      clearTimeout(morphTimeoutRef.current);
      morphTimeoutRef.current = null;
    }
    setDraftAnswer("");
    setAnswers({});
    setMessages([]);
    setMissingFields([]);
    setSearchStage("idle");
    setIsMorphingFirstBubble(false);
    setMorphBubble(null);
    morphStartRectRef.current = null;
  }

  function handleSelectImage(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }

    setAttachedImage({
      name: nextFile.name,
      previewUrl: URL.createObjectURL(nextFile),
    });
  }

  function handleRemoveImage() {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }

    setAttachedImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function playFirstBubbleMorph(initialQuery: string) {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const startRect = morphStartRectRef.current;
    const targetRect = firstUserBubbleRef.current?.getBoundingClientRect();
    const searchRowHeight =
      searchRowRef.current?.getBoundingClientRect().height ?? 0;
    const statusRowHeight =
      statusRowRef.current?.getBoundingClientRect().height ?? 0;

    if (!containerRect || !startRect || !targetRect) {
      setIsMorphingFirstBubble(false);
      setMorphBubble(null);
      return;
    }

    setMorphBubble({
      text: initialQuery,
      style: {
        top: startRect.top - containerRect.top + 8,
        left: startRect.left - containerRect.left + 12,
        width: startRect.width - 24,
        height: startRect.height - 10,
        opacity: 1,
        transform: "scale(1)",
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMorphBubble({
          text: initialQuery,
          style: {
            top:
              targetRect.top -
              containerRect.top +
              FIRST_BUBBLE_TARGET_Y_OFFSET -
              searchRowHeight -
              statusRowHeight,
            left: targetRect.left - containerRect.left,
            width: targetRect.width,
            height: targetRect.height,
            opacity: 0.12,
            transform: "scale(0.92)",
          },
        });
      });
    });

    morphTimeoutRef.current = setTimeout(() => {
      setMorphBubble(null);
      setIsMorphingFirstBubble(false);
      morphStartRectRef.current = null;
      morphTimeoutRef.current = null;
    }, 620);
  }

  function openClarifyFlow(
    nextMissingFields: ClarifyField[],
    initialQuery: string,
  ) {
    const firstPrompt = promptByField[nextMissingFields[0]];

    setIsChatOpen(true);
    setDraftAnswer("");
    setAnswers({});
    setMissingFields(nextMissingFields);
    setSearchStage("ready");
    setIsMorphingFirstBubble(true);
    morphStartRectRef.current = searchRowRef.current?.getBoundingClientRect() ?? null;
    setMessages([
      createMessage("user", initialQuery),
      createMessage("assistant", firstPrompt.question),
    ]);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        playFirstBubbleMorph(initialQuery);
      });
    });
  }

  async function handleSubmitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextQuery = query.trim();
    if (!nextQuery) {
      return;
    }

    const currentRunId = searchRunIdRef.current + 1;
    searchRunIdRef.current = currentRunId;
    setSearchStage("analyzing");

    await wait(320);
    if (searchRunIdRef.current !== currentRunId) {
      return;
    }

    const assessment = assessQuery(nextQuery);
    setSearchStage("matching");

    await wait(420);
    if (searchRunIdRef.current !== currentRunId) {
      return;
    }

    if (assessment.missingFields.length === 0) {
      setIsChatOpen(false);
      setSearchStage("navigating");
      await wait(280);
      if (searchRunIdRef.current !== currentRunId) {
        return;
      }
      navigateToSearch(nextQuery);
      return;
    }

    setSearchStage("clarifying");
    await wait(320);
    if (searchRunIdRef.current !== currentRunId) {
      return;
    }
    openClarifyFlow(assessment.missingFields, nextQuery);
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
    <div ref={containerRef} className="relative mx-auto w-full max-w-3xl">
      <div
        className={`overflow-hidden rounded-[1.6rem] border border-outline-variant/30 transition-all duration-500 ease-out ${
          isChatOpen
            ? "bg-[linear-gradient(180deg,rgba(220,225,255,0.52)_0%,rgba(255,255,255,0.98)_18%,rgba(255,255,255,1)_100%)] shadow-[0_28px_80px_rgba(0,35,111,0.16)] ring-2 ring-primary/10"
            : "bg-surface-container-lowest shadow-[0_10px_30px_rgba(0,35,111,0.06)]"
        }`}
      >
        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            isChatOpen
              ? "max-h-0 opacity-0"
              : attachedImage
                ? "max-h-56 opacity-100"
                : "max-h-28 opacity-100"
          }`}
        >
          <form onSubmit={handleSubmitSearch}>
            <div className="px-4 py-3">
              <div ref={searchRowRef} className="flex items-center gap-3">
                <SearchIcon className="h-5 w-5 text-outline" />
                <input
                  type="text"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="예: 검은 가죽 지갑, 홍대입구"
                  className="w-full bg-transparent py-2 text-lg text-on-surface outline-none placeholder:text-outline-variant"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/12 bg-primary/5 text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/10 active:scale-95"
                  aria-label="이미지 첨부"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-on-primary transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-70"
                >
                  {isPending ? "검색 중..." : "검색"}
                </button>
              </div>

              {attachedImage ? (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2.5">
                  <Image
                    src={attachedImage.previewUrl}
                    alt={attachedImage.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">
                      이미지가 첨부되었어요
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {attachedImage.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-full border border-primary/12 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    제거
                  </button>
                </div>
              ) : null}
            </div>
          </form>
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            isStatusVisible ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div
            ref={statusRowRef}
            className="flex items-center gap-2 px-4 pb-4 text-sm font-semibold text-primary/80"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {stageCopy}
          </div>
        </div>

        <SearchChatPanel
          isOpen={isChatOpen}
          messages={messages}
          draftAnswer={draftAnswer}
          currentPrompt={currentPrompt ?? undefined}
          summaryQuery={missingFields.length === 0 ? summaryQuery : undefined}
          isNavigating={isPending}
          firstUserBubbleRef={firstUserBubbleRef}
          hideFirstUserBubble={isMorphingFirstBubble}
          onDraftAnswerChange={setDraftAnswer}
          onSubmitAnswer={() => handleSubmitAnswer()}
          onSearchNow={() => navigateToSearch(summaryQuery)}
          onClose={() => {
            resetChat();
            setIsChatOpen(false);
          }}
        />

        {morphBubble ? (
          <div
            className="pointer-events-none absolute z-20 overflow-hidden rounded-[1.25rem] bg-primary text-on-primary shadow-[0_18px_34px_rgba(0,35,111,0.22)]"
            style={{
              ...morphBubble.style,
              position: "absolute",
              transition:
                "top 620ms cubic-bezier(0.2, 0.78, 0.2, 1), left 620ms cubic-bezier(0.2, 0.78, 0.2, 1), width 620ms cubic-bezier(0.2, 0.78, 0.2, 1), height 620ms cubic-bezier(0.2, 0.78, 0.2, 1), opacity 620ms ease, transform 620ms cubic-bezier(0.2, 0.78, 0.2, 1)",
            }}
          >
            <div className="flex h-full items-center px-5 py-3">
              <p className="truncate text-base font-semibold">{morphBubble.text}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
