import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useStore } from '@/store'
import { nanoid } from '@/lib/nanoid'

const GUEST_ID_KEY = 'zd_guest_id'

function getOrCreateGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) { id = nanoid(); localStorage.setItem(GUEST_ID_KEY, id) }
  return id
}

export function useAuth() {
  const { user, authLoading, setUser, setAuthLoading, signOut } = useStore()

  useEffect(() => {
    // ── Guest / demo mode — no Supabase project configured ───────────────────
    if (!isSupabaseConfigured) {
      const guestId = getOrCreateGuestId()
      setUser({
        id:         guestId,
        email:      'guest@local',
        full_name:  'Guest',
        avatar_url: null,
        created_at: new Date().toISOString(),
      })
      setAuthLoading(false)
      return
    }

    // ── Real Supabase auth ────────────────────────────────────────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setUser(data ?? null)
            setAuthLoading(false)
          })
      } else {
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUser(data ?? null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setAuthLoading])

  return { user, authLoading, signOut }
}
