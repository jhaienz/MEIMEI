"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { startRun, submitResponse, type ServedQuestion } from "@/app/actions";
import { Boards, type BoardsData } from "@/components/boards";
import { KnowledgeRound, type GivenAnswer } from "@/components/knowledge-round";
import { Landing } from "@/components/landing";
import { NameEntry } from "@/components/name-entry";
import { PersonaRound } from "@/components/persona-round";
import { Reveal } from "@/components/reveal";
import { ABANDON_IDLE_MS } from "@/lib/constants";
import { personaById, type PersonaId, type Trait } from "@/lib/personas";

/** How often the idle boards pull fresh standings, so they are live all day. */
const BOARDS_REFRESH_MS = 15_000;

type Phase = "home" | "boards" | "name" | "persona" | "knowledge" | "reveal";

type Finished = { name: string; personaId: PersonaId; score: number };

/**
 * The loop that runs all day unattended (ADR-0008):
 *
 *   Home → START → Name → Persona Round → Knowledge Round → Reveal
 *     → boards with the new entry highlighted → idle
 *
 * The in-progress Response is held here and written once, at the end. An abandoned run
 * writes nothing.
 */
export function Kiosk({ boards }: { boards: BoardsData }) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("home");
  const [name, setName] = useState("");
  const [personaAnswers, setPersonaAnswers] = useState<{ trait: Trait }[]>([]);
  const [questions, setQuestions] = useState<ServedQuestion[]>([]);
  const [finished, setFinished] = useState<Finished | undefined>();
  const [highlight, setHighlight] = useState<
    { responseId: number; personaId: PersonaId } | undefined
  >();

  const toBoards = useCallback(() => {
    setPhase("boards");
    setName("");
    setPersonaAnswers([]);
    setQuestions([]);
    setFinished(undefined);
  }, []);

  // The boards are the resting state, so they have to be live without anyone touching the
  // laptop. Only poll while idle — never mid-run, where a refresh would be pure noise.
  useEffect(() => {
    if (phase !== "boards") return;
    const poll = setInterval(() => router.refresh(), BOARDS_REFRESH_MS);
    return () => clearInterval(poll);
  }, [phase, router]);

  /*
    On Name and the Persona Round: a student who wanders off halfway would otherwise wedge
    the kiosk on question four for the rest of the day, because nothing else there advances
    on its own. This is not a question timer and is never shown — the Persona Round is
    untimed (ADR-0006) — it only recovers an abandoned laptop, and any touch resets it.

    The Knowledge Round is deliberately exempt: it advances itself every thirty seconds, so
    it cannot wedge, and it is bounded at six minutes. Applying the abandon timeout there
    would throw away the run of a student who simply hit six hard questions in a row and let
    them time out without touching the screen — losing a real run to save nothing.
  */
  const [activity, setActivity] = useState(0);
  useEffect(() => {
    if (phase !== "name" && phase !== "persona") return;

    const idle = setTimeout(toBoards, ABANDON_IDLE_MS);
    return () => clearTimeout(idle);
  }, [phase, activity, toBoards]);

  const begin = () => {
    setPhase("name");
    // Draw the Knowledge Round questions now, during the ~85 seconds of Name and Persona
    // Round, so the student never watches a spinner with a queue behind them.
    void startRun().then(setQuestions);
  };

  const onNamed = (given: string) => {
    setName(given);
    setPhase("persona");
  };

  const onPersonaDone = (answers: { trait: Trait }[]) => {
    setPersonaAnswers(answers);
    setPhase("knowledge");
  };

  const onKnowledgeDone = async (answers: GivenAnswer[], elapsedMs: number) => {
    const result = await submitResponse({
      name,
      personaAnswers,
      knowledgeAnswers: answers,
      elapsedMs,
    });

    setFinished({ name, personaId: result.personaId, score: result.score });
    setHighlight({ responseId: result.responseId, personaId: result.personaId });
    setPhase("reveal");
    // Pull the boards the student is about to be sent back to, so their Team's bar has
    // already grown and their Name is already on the Rank Board when they get there.
    router.refresh();
  };

  const screen = () => {
    switch (phase) {
      case "home":
        return <Landing onStart={begin} onBoards={() => setPhase("boards")} />;

      case "name":
        return <NameEntry onSubmit={onNamed} />;

      case "persona":
        return <PersonaRound onDone={onPersonaDone} />;

      case "knowledge":
        // The draw is a local SQLite read that has had the whole Persona Round to finish.
        return questions.length ? (
          <KnowledgeRound questions={questions} onDone={onKnowledgeDone} />
        ) : (
          <div className="center-wrap">
            <p className="name-sub">Dealing your questions…</p>
          </div>
        );

      case "reveal":
        return finished ? (
          <Reveal
            name={finished.name}
            persona={personaById(finished.personaId)}
            score={finished.score}
            onDismiss={toBoards}
          />
        ) : null;

      default:
        return (
          <Boards
            data={boards}
            highlightId={highlight?.responseId}
            highlightPersonaId={highlight?.personaId}
            onHome={() => setPhase("home")}
            onStart={begin}
          />
        );
    }
  };

  return (
    <div
      onPointerDown={() => setActivity((tick) => tick + 1)}
      onKeyDown={() => setActivity((tick) => tick + 1)}
    >
      {screen()}
    </div>
  );
}
