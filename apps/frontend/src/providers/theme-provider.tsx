import { useEffect, useState } from 'react'
import { ThemeProviderContext, type Theme } from './use-theme'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

/**
 * Calcula el tema efectivo a aplicar al DOM.
 * Si theme es 'system', resuelve a 'dark'|'light' según preferencia OS.
 */
function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'licitaapp-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  // resolvedTheme derivado durante el render, sin useEffect
  const resolvedTheme = resolveTheme(theme)

  // useEffect solo para SINCRONIZAR DOM (efecto externo), no para setState
  useEffect(() => {
    const root = window.document.documentElement

    // Smooth transition between themes
    root.classList.add('transitioning')
    const timeout = setTimeout(() => root.classList.remove('transitioning'), 300)

    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)

    return () => clearTimeout(timeout)
  }, [resolvedTheme])

  // Listen to system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      // Forzar re-render cambiando theme al mismo valor 'system'
      // (el resolvedTheme se recalculará en el render)
      setThemeState('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}