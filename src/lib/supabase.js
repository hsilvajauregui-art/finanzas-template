import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wkcatgjcdwxomgpyaxdr.supabase.co'
const supabaseAnonKey = 'sb_publishable_6OCQA8wqCHaKJ6vsPGg4iA_k-6rkQW0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
