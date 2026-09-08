import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://irxoojfccfyyuloagzsw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_JH-sUu-5tVdNGCO08U6FEA_TMfqfKoY'
const ACTIVE_MENU_KEY = 'smart-menu-planner:active-menu'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export interface SharedMenu {
  id: string
  title: string
  invite_code: string
  owner_id: string
  created_at: string
  updated_at: string
}

export async function ensureCloudSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
  const { data: signed, error } = await supabase.auth.signInAnonymously()
  if (error || !signed.session) throw new Error(error?.message || '无法建立匿名账号')
  return signed.session
}

export async function listSharedMenus(): Promise<SharedMenu[]> {
  await ensureCloudSession()
  const { data, error } = await supabase.from('menus').select('*').order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as SharedMenu[]
}

export async function createSharedMenu(title: string): Promise<SharedMenu> {
  await ensureCloudSession()
  const { data, error } = await supabase.rpc('create_shared_menu', { menu_title: title.trim() || '我们的菜单' })
  if (error) throw new Error(error.message)
  const menu = (Array.isArray(data) ? data[0] : data) as SharedMenu
  if (!menu?.id) throw new Error('创建菜单失败')
  setActiveMenuId(menu.id)
  return menu
}

export async function joinSharedMenu(code: string): Promise<string> {
  await ensureCloudSession()
  const { data, error } = await supabase.rpc('join_shared_menu', { code: code.trim().toUpperCase() })
  if (error) throw new Error(error.message.includes('邀请码') ? '邀请码不存在，请检查后重试' : error.message)
  const menuId = String(data)
  setActiveMenuId(menuId)
  return menuId
}

export function getActiveMenuId() { return localStorage.getItem(ACTIVE_MENU_KEY) || '' }
export function setActiveMenuId(id: string) { localStorage.setItem(ACTIVE_MENU_KEY, id) }
