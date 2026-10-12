import { createContext, useContext } from 'react'
export interface AppPreferences { reducedMotion: boolean; timezone: string }
export const AppPreferencesContext = createContext<AppPreferences>({ reducedMotion: false, timezone: 'Europe/Kyiv' })
export const useAppPreferences = () => useContext(AppPreferencesContext)
