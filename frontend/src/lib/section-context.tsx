"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type SectionGroup = "all" | "nursery_primary" | "secondary";

interface SectionContextValue {
  sectionGroup: SectionGroup;
  setSectionGroup: (group: SectionGroup) => void;
}

const SectionContext = createContext<SectionContextValue>({
  sectionGroup: "all",
  setSectionGroup: () => {},
});

export function SectionProvider({ children }: { children: ReactNode }) {
  const [sectionGroup, setSectionGroup] = useState<SectionGroup>("all");

  useEffect(() => {
    const saved = localStorage.getItem("sectionGroup") as SectionGroup | null;
    if (saved) setSectionGroup(saved); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const handleSet = (group: SectionGroup) => {
    setSectionGroup(group);
    localStorage.setItem("sectionGroup", group);
  };

  return (
    <SectionContext.Provider value={{ sectionGroup, setSectionGroup: handleSet }}>
      {children}
    </SectionContext.Provider>
  );
}

export function useSection() {
  return useContext(SectionContext);
}
