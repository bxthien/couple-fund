import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('contributions')
    .insert({ amount: 1000, user_id: 'A', month: '2026-04' })
    .select()

  console.log("Test with user_id:", { data, error })
  
  const { data: d2, error: e2 } = await supabase
    .from('contributions')
    .insert({ amount: 1000, paid_by: 'A', month: '2026-04' })
    .select()
    
  console.log("Test with paid_by:", { data: d2, error: e2 })
}
test()
