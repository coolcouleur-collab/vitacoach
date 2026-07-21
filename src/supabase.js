import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ejbfexxhrxcvmolpwuvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmZleHhocnhjdm1vbHB3dXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDUwODMsImV4cCI6MjA5MDUyMTA4M30.kNdebBhFovcKqdCqpmfHkNmzsV9a5Vw9QWpgzwOlXOk'
)

// Retourne le header Authorization avec le token de session Supabase (ou {} si pas de session).
// Ne throw jamais — les appels API restent fonctionnels même sans session.
export async function authHeaders() {
  try {
    const { data } = await supabase.auth.getSession()
    const t = data?.session?.access_token
    return t ? { Authorization: `Bearer ${t}` } : {}
  } catch {
    return {}
  }
}
