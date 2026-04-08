import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'apps/web/.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'missing'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'missing'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('reporting_lines').select('*').limit(1)
  console.log('Data:', data)
  console.log('Error:', error)
}
run()
