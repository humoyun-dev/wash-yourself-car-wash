import { PersistedState } from "@/types/types";
import { useEffect, useState } from "react";

export const usePersistedState = () => {
  // Load persisted state from localStorage on initialization
  const [persistedState, setPersistedState] = useState<PersistedState>(() => {
    try {
      const saved = localStorage.getItem("washingServiceState");
      return saved
        ? JSON.parse(saved)
        : { selectedProgramId: null, isRunning: false };
    } catch (e) {
      console.error("Failed to load persisted state:", e);
      return { selectedProgramId: null, isRunning: false }; // Default state
    }
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "washingServiceState",
        JSON.stringify(persistedState)
      );
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }, [persistedState]);

  // Update a specific key in the persisted state
  const updateState = (key: keyof PersistedState, value: any) => {
    setPersistedState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  return {
    persistedState,
    updateState,
    resetState: () =>
      setPersistedState({ selectedProgramId: null, isRunning: false }),
  };
};
