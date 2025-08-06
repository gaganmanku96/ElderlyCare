// Context for tracking meaningful screen state changes for smart screenshot updates
// Allows screen components to signal when navigation happens

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ScreenStateContextType {
  screenState: string;
  updateScreenState: (newState: string) => void;
}

const ScreenStateContext = createContext<ScreenStateContextType | undefined>(undefined);

interface ScreenStateProviderProps {
  children: ReactNode;
}

export function ScreenStateProvider({ children }: ScreenStateProviderProps) {
  const [screenState, setScreenState] = useState<string>('initial');

  const updateScreenState = useCallback((newState: string) => {
    console.log('Screen state updated:', newState);
    setScreenState(newState);
  }, []);

  return (
    <ScreenStateContext.Provider value={{ screenState, updateScreenState }}>
      {children}
    </ScreenStateContext.Provider>
  );
}

export function useScreenState() {
  const context = useContext(ScreenStateContext);
  if (context === undefined) {
    throw new Error('useScreenState must be used within a ScreenStateProvider');
  }
  return context;
}

// Helper hook for screen components to easily update state
export function useScreenNavigation(screenId: string) {
  const { updateScreenState } = useScreenState();

  const navigateTo = useCallback((subState: string) => {
    updateScreenState(`${screenId}-${subState}-${Date.now()}`);
  }, [screenId, updateScreenState]);

  return navigateTo;
}