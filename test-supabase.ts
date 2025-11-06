import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase connection...\n')

if (!supabaseUrl) {
  console.error('❌ Error: VITE_SUPABASE_URL is not set')
  console.log('   Make sure your .env file contains VITE_SUPABASE_URL')
  process.exit(1)
}

if (!supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY is not set')
  console.log('   Make sure your .env file contains VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('✅ Environment variables found')
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`)
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`)

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection by trying to fetch from a non-existent table
// This will fail gracefully if connection works but table doesn't exist
async function testConnection() {
  try {
    console.log('🔗 Testing connection to Supabase...')
    
    // Try a simple query that will work regardless of tables
    // We'll use the auth endpoint which is always available
    const { error } = await supabase.auth.getSession()
    
    if (error && error.message.includes('Invalid API key')) {
      console.error('❌ Connection failed: Invalid API key')
      console.log('   Please check your VITE_SUPABASE_ANON_KEY')
      process.exit(1)
    }
    
    // If we get here, the connection works (auth.getSession may return null, which is fine)
    console.log('✅ Successfully connected to Supabase!')
    console.log('   Your Supabase client is properly configured.\n')
    
    // Optional: Test if we can access the database
    console.log('📊 Testing database access...')
    const { error: dbError } = await supabase
      .from('games')
      .select('count')
      .limit(1)
    
    if (dbError) {
      if (dbError.message.includes('relation "games" does not exist')) {
        console.log('⚠️  Database table "games" does not exist yet')
        console.log('   This is expected if you haven\'t created the schema yet')
        console.log('   The connection is working, but you\'ll need to create the table')
      } else if (dbError.message.includes('permission denied')) {
        console.log('⚠️  Permission denied - RLS policies may be blocking access')
        console.log('   Connection works, but you may need to configure RLS policies')
      } else {
        console.log(`⚠️  Database error: ${dbError.message}`)
      }
    } else {
      console.log('✅ Database access working!')
      console.log('   The "games" table exists and is accessible')
    }
    
    console.log('\n🎉 Supabase connection test complete!')
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    process.exit(1)
  }
}

testConnection()

