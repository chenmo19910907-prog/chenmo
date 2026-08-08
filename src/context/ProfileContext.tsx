import { createContext, useCallback, useContext, useState } from 'react'
import type { PersonalProfile } from '../types/profile'
import { loadProfile, saveProfile } from '../utils/storage'

interface ProfileContextValue {
  profile: PersonalProfile
  updateProfile: (updater: (profile: PersonalProfile) => PersonalProfile) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<PersonalProfile>(() => loadProfile())

  const updateProfile = useCallback(
    (updater: (profile: PersonalProfile) => PersonalProfile) => {
      setProfile((prev) => {
        const next = updater(prev)
        saveProfile(next)
        return next
      })
    },
    [],
  )

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
