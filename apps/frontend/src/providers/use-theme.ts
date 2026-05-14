import { createContext, useContext } from 'react'

export type Theme = 'dark' | 'light' | 'system'

export interface ThemeProviderState {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}