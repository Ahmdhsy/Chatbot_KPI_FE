"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface HeaderSearchScope {
  id: string;
  label: string;
  getMatchCount: (query: string) => number;
}

interface HeaderSearchContextType {
  query: string;
  setQuery: (value: string) => void;
  scope: HeaderSearchScope | null;
  registerScope: (scope: HeaderSearchScope) => () => void;
}

const HeaderSearchContext = createContext<HeaderSearchContextType | undefined>(
  undefined
);

export function HeaderSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<HeaderSearchScope | null>(null);

  const registerScope = useCallback((nextScope: HeaderSearchScope) => {
    setScope(nextScope);

    return () => {
      setScope((currentScope) => {
        if (currentScope?.id !== nextScope.id) {
          return currentScope;
        }
        return null;
      });
    };
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      scope,
      registerScope,
    }),
    [query, scope, registerScope]
  );

  return (
    <HeaderSearchContext.Provider value={value}>
      {children}
    </HeaderSearchContext.Provider>
  );
}

export function useHeaderSearch() {
  const context = useContext(HeaderSearchContext);
  if (context === undefined) {
    throw new Error("useHeaderSearch must be used within a HeaderSearchProvider");
  }
  return context;
}
