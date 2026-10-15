"use client";
import { useCallback, useEffect, useState } from "react";
import { dismissMaiaGuidance, emptyMaiaGuidanceState, receiveMaiaGuidance, type MaiaGuidance, type MaiaGuidanceScope } from "@/lib/maia/proactive";

/** No network, grading, input changes, or fabricated conversation turns. */
export function useMaiaGuidance(scope: MaiaGuidanceScope, incoming?: MaiaGuidance | null) {
  const [state, setState] = useState(() => receiveMaiaGuidance(emptyMaiaGuidanceState(), scope, incoming));
  const { sessionId, stepId, variantIndex, sessionVersion, independent } = scope;
  useEffect(() => {
    const frame = requestAnimationFrame(() => setState((previous) => receiveMaiaGuidance(previous, { sessionId, stepId, variantIndex, sessionVersion, independent }, incoming)));
    return () => cancelAnimationFrame(frame);
  }, [sessionId, stepId, variantIndex, sessionVersion, independent, incoming]);
  const dismiss = useCallback(() => setState(dismissMaiaGuidance), []);
  return { guidance: receiveMaiaGuidance(state, scope, incoming).current, dismiss };
}
