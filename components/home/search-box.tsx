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
import { searchLostItemsDirect } from "@/lib/lost-items-search-browser";
import {
  createSearchResultCacheKey,
  saveSearchResultToSession,
} from "@/lib/search-result-session-cache";
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
  id: string;
  file: File;
  name: string;
  previewUrl: string;
};

type SearchAgentResponse = {
  cacheKey?: string;
  sessionId?: string | null;
  assistantMessage?: string | null;
};

type ProgressStep = {
  id: string;
  label: string;
};

type ProgressTimeline = {
  steps: ProgressStep[];
  checkpoints: number[];
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

const SEARCH_PROGRESS_TIMELINE: ProgressTimeline = {
  steps: [
    { id: "session", label: "이전 검색 흐름과 세션을 정리하고 있어요" },
    { id: "vector", label: "비슷한 분실물을 먼저 넓게 찾고 있어요" },
    { id: "rerank", label: "관련도가 높은 결과만 다시 고르고 있어요" },
    { id: "save", label: "검색 결과와 대화 기록을 정리하고 있어요" },
  ],
  checkpoints: [0, 1800, 4300, 6600],
};

const CLARIFY_PROGRESS_TIMELINE: ProgressTimeline = {
  steps: [
    { id: "session", label: "이전 검색 흐름과 세션을 정리하고 있어요" },
    { id: "vector", label: "비슷한 분실물을 먼저 살펴보고 있어요" },
    { id: "clarify", label: "지금 더 물어봐야 할 내용을 정리하고 있어요" },
  ],
  checkpoints: [0, 2400, 5600],
};

function getProgressTimeline(stage: SearchStage): ProgressTimeline {
  if (stage === "clarifying") {
    return CLARIFY_PROGRESS_TIMELINE;
  }

  if (stage === "navigating") {
    return SEARCH_PROGRESS_TIMELINE;
  }

  return {
    steps: [{ id: stage, label: "검색어와 첨부 정보를 확인하고 있어요" }],
    checkpoints: [0],
  };
}

function assessQuery(query: string) {
  const normalized = query.trim();
  const hasItem = itemPattern.test(normalized);

  if (!hasItem) {
    return {
      missingFields: ["item"] as ClarifyField[],
    };
  }

  return {
    missingFields: [] as ClarifyField[],
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

function createSearchSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `search-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function SearchBox({ defaultQuery }: SearchBoxProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRowRef = useRef<HTMLDivElement>(null);
  const statusRowRef = useRef<HTMLDivElement>(null);
  const firstUserBubbleRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachedImagesRef = useRef<AttachedImage[]>([]);
  const morphTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const morphStartRectRef = useRef<DOMRect | null>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [missingFields, setMissingFields] = useState<ClarifyField[]>([]);
  const [searchSessionId, setSearchSessionId] = useState<string | null>(() =>
    createSearchSessionId(),
  );
  const [answers, setAnswers] = useState<Partial<Record<ClarifyField, string>>>(
    {},
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchStage, setSearchStage] = useState<SearchStage>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeProgressIndex, setActiveProgressIndex] = useState(0);
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
  const progressTimeline = useMemo(
    () => getProgressTimeline(searchStage),
    [searchStage],
  );
  const progressSteps = progressTimeline.steps;
  const isSearchSubmitting =
    searchStage === "analyzing" ||
    searchStage === "matching" ||
    searchStage === "clarifying" ||
    searchStage === "navigating" ||
    isPending;
  const isStatusVisible =
    searchStage !== "idle" && searchStage !== "ready";

  function updateSearchStage(nextStage: SearchStage) {
    setSearchStage(nextStage);
    setActiveProgressIndex(0);
  }

  useEffect(() => {
    if (!isStatusVisible) {
      return;
    }

    if (progressTimeline.checkpoints.length <= 1) {
      return;
    }

    const timers = progressTimeline.checkpoints
      .slice(1)
      .map((checkpoint, index) =>
        window.setTimeout(() => {
          setActiveProgressIndex(index + 1);
        }, checkpoint),
      );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isStatusVisible, progressTimeline]);

  useEffect(() => {
    attachedImagesRef.current = attachedImages;
  }, [attachedImages]);

  useEffect(() => {
    return () => {
      attachedImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  function navigateToSearch(
    nextQuery: string,
    sessionId?: string | null,
    cacheKey?: string,
  ) {
    updateSearchStage("navigating");
    startTransition(() => {
      const params = new URLSearchParams({
        q: nextQuery,
      });

      if (sessionId) {
        params.set("sid", sessionId);
      }

      if (cacheKey) {
        params.set("ck", cacheKey);
      }

      router.push(`/search?${params.toString()}`);
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
    setSearchSessionId((current) => current ?? createSearchSessionId());
    updateSearchStage("idle");
    setSubmitError(null);
    setIsMorphingFirstBubble(false);
    setMorphBubble(null);
    morphStartRectRef.current = null;
  }

  async function requestAgentResponse(
    nextQuery: string,
    sessionId?: string | null,
  ): Promise<SearchAgentResponse | null> {
    try {
      const normalizedQuery = nextQuery.trim();
      const latestImage = attachedImages[attachedImages.length - 1]?.file ?? null;
      const result = await searchLostItemsDirect({
        query: normalizedQuery,
        sessionId: sessionId ?? undefined,
        image: latestImage,
      });

      const cacheKey = createSearchResultCacheKey();
      saveSearchResultToSession(cacheKey, result);

      return {
        cacheKey,
        sessionId: result.sessionId,
        assistantMessage: result.assistantMessage,
      };
    } catch {
      return null;
    }
  }

  function handleSelectImage(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);

    if (nextFiles.length === 0) {
      return;
    }

    const nextImages = nextFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));

    setAttachedImages((current) => [...current, ...nextImages]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveImage(imageId: string) {
    setAttachedImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return current.filter((image) => image.id !== imageId);
    });

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
    assistantMessage?: string | null,
    sessionId?: string | null,
  ) {
    const firstPrompt = promptByField[nextMissingFields[0]];

    setIsChatOpen(true);
    setDraftAnswer("");
    setAnswers({});
    setMissingFields(nextMissingFields);
    setSearchSessionId(
      (current) => sessionId ?? current ?? createSearchSessionId(),
    );
    updateSearchStage("ready");
    setIsMorphingFirstBubble(true);
    morphStartRectRef.current = searchRowRef.current?.getBoundingClientRect() ?? null;
    setMessages([
      createMessage("user", initialQuery),
      createMessage(
        "assistant",
        assistantMessage?.trim() || firstPrompt.question,
      ),
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
    const hasAttachedImage = attachedImages.length > 0;

    if (!nextQuery && !hasAttachedImage) {
      return;
    }

    const currentRunId = searchRunIdRef.current + 1;
    searchRunIdRef.current = currentRunId;
    setSubmitError(null);
    updateSearchStage("analyzing");

    if (hasAttachedImage) {
      setIsChatOpen(false);
      updateSearchStage("navigating");
      const agentResponse = await requestAgentResponse(nextQuery, searchSessionId);
      if (searchRunIdRef.current !== currentRunId) {
        return;
      }
      if (!agentResponse?.cacheKey) {
        updateSearchStage("idle");
        setSubmitError("검색 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      navigateToSearch(
        nextQuery,
        agentResponse?.sessionId ?? searchSessionId,
        agentResponse?.cacheKey,
      );
      return;
    }

    const assessment = assessQuery(nextQuery);
    updateSearchStage("matching");

    if (assessment.missingFields.length === 0) {
      setIsChatOpen(false);
      updateSearchStage("navigating");
      if (searchRunIdRef.current !== currentRunId) {
        return;
      }
      const agentResponse = await requestAgentResponse(nextQuery, searchSessionId);
      if (searchRunIdRef.current !== currentRunId) {
        return;
      }
      if (!agentResponse?.cacheKey) {
        updateSearchStage("idle");
        setSubmitError("검색 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      navigateToSearch(
        nextQuery,
        agentResponse?.sessionId ?? searchSessionId,
        agentResponse?.cacheKey,
      );
      return;
    }

    updateSearchStage("clarifying");
    if (searchRunIdRef.current !== currentRunId) {
      return;
    }

    const agentResponse = await requestAgentResponse(nextQuery, searchSessionId);
    if (searchRunIdRef.current !== currentRunId) {
      return;
    }

    openClarifyFlow(
      assessment.missingFields,
      nextQuery,
      agentResponse?.assistantMessage,
      agentResponse?.sessionId,
    );
  }

  async function handleSubmitAnswer(rawValue?: string) {
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
    const nextQuery = buildSearchQuery(query, nextAnswers);
    const agentResponse = await requestAgentResponse(nextQuery, searchSessionId);

    if (agentResponse?.sessionId) {
      setSearchSessionId(agentResponse.sessionId);
    }

    if (remainingFields.length === 0) {
      setAnswers(nextAnswers);
      setMissingFields([]);
      setMessages([
        ...nextMessages,
        createMessage(
          "assistant",
          agentResponse?.assistantMessage?.trim() ||
            `좋아요. "${nextQuery}" 기준으로 바로 찾아볼 수 있어요.`,
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
      createMessage(
        "assistant",
        agentResponse?.assistantMessage?.trim() || nextPrompt.question,
      ),
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
              : attachedImages.length > 0
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
                  multiple
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
                  disabled={isSearchSubmitting}
                  className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-on-primary transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-70"
                >
                  {isSearchSubmitting ? "검색 중..." : "검색"}
                </button>
              </div>

              {attachedImages.length > 0 ? (
                <div className="no-scrollbar mt-3 overflow-x-auto pt-2">
                  <div className="flex min-w-max gap-3 px-1">
                    {[...attachedImages].reverse().map((image) => (
                      <div key={image.id} className="relative h-14 w-14 shrink-0">
                        <Image
                          src={image.previewUrl}
                          alt={image.name}
                          width={56}
                          height={56}
                          unoptimized
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image.id)}
                          className="absolute -right-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary shadow-[0_8px_16px_rgba(0,35,111,0.18)] transition-transform hover:scale-105 active:scale-95"
                          aria-label="첨부 이미지 제거"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </form>
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            isStatusVisible ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div
            ref={statusRowRef}
            className="px-4 pb-4"
          >
            <div className="rounded-[1.1rem] border border-primary/10 bg-primary-fixed/28 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                {progressSteps[Math.min(activeProgressIndex, progressSteps.length - 1)]
                  ?.label ?? ""}
              </div>
              <div className="mt-3 space-y-2">
                {progressSteps.map((step, index) => {
                  const isCompleted = index < activeProgressIndex;
                  const isCurrent = index === activeProgressIndex;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        isCurrent
                          ? "font-semibold text-on-surface"
                          : isCompleted
                            ? "text-primary/80"
                            : "text-on-surface-variant/65"
                      }`}
                    >
                      <span
                        className={`inline-flex h-2.5 w-2.5 rounded-full ${
                          isCurrent
                            ? "bg-primary shadow-[0_0_0_4px_rgba(64,89,170,0.14)]"
                            : isCompleted
                              ? "bg-primary/70"
                              : "bg-outline-variant"
                        }`}
                      />
                      {step.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <SearchChatPanel
          isOpen={isChatOpen}
          messages={messages}
          draftAnswer={draftAnswer}
          currentPrompt={currentPrompt ?? undefined}
          summaryQuery={missingFields.length === 0 ? summaryQuery : undefined}
          isNavigating={searchStage === "navigating" || isPending}
          firstUserBubbleRef={firstUserBubbleRef}
          hideFirstUserBubble={isMorphingFirstBubble}
          onDraftAnswerChange={setDraftAnswer}
          onSubmitAnswer={() => {
            void handleSubmitAnswer();
          }}
          onSearchNow={() => {
            void (async () => {
              updateSearchStage("navigating");
              const agentResponse = await requestAgentResponse(
                summaryQuery,
                searchSessionId,
              );
              if (!agentResponse?.cacheKey) {
                updateSearchStage("ready");
                setSubmitError(
                  "검색 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.",
                );
                return;
              }
              navigateToSearch(
                summaryQuery,
                agentResponse?.sessionId ?? searchSessionId,
                agentResponse?.cacheKey,
              );
            })();
          }}
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
      {submitError ? (
        <p className="mt-3 px-2 text-sm font-medium text-error">{submitError}</p>
      ) : null}
    </div>
  );
}
