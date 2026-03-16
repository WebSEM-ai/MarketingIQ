"use client";

import { useState, useEffect } from "react";
import type { ModuleId, SynergyPayload } from "./types";
import { consumeSynergyPayload } from "./actions";

export function useSynergyReceiver(target: ModuleId) {
  const [incoming, setIncoming] = useState<SynergyPayload | null>(null);

  useEffect(() => {
    const payload = consumeSynergyPayload(target);
    if (payload) {
      setIncoming(payload);
    }
  }, [target]);

  const dismiss = () => setIncoming(null);

  return { incoming, dismiss };
}
