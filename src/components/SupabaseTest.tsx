import { useState } from 'react'
import { supabase } from '../lib/supabase'

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

interface TestResult {
  status: TestStatus
  message: string
  details?: string
}

export function SupabaseTest() {
  const [result, setResult] = useState<TestResult>({ status: 'idle', message: '' })

  const testConnection = async () => {
    setResult({ status: 'testing', message: 'Testing connection...' })

    try {
      // Test 1: Check environment variables
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!url || !key) {
        setResult({
          status: 'error',
          message: '❌ Missing environment variables',
          details: `URL: ${url ? '✅' : '❌'}, Key: ${key ? '✅' : '❌'}`,
        })
        return
      }

      // Test 2: Test auth connection (works even without tables)
      const { error: authError } = await supabase.auth.getSession()

      if (authError && authError.message.includes('Invalid API key')) {
        setResult({
          status: 'error',
          message: '❌ Invalid API key',
          details: 'Please check your VITE_SUPABASE_ANON_KEY',
        })
        return
      }

      // Test 3: Try to access database (may fail if table doesn't exist, which is OK)
      const { error: dbError } = await supabase
        .from('games')
        .select('count')
        .limit(1)

      if (dbError) {
        if (dbError.message.includes('Could not find the table') || 
            dbError.message.includes('relation "games" does not exist')) {
          setResult({
            status: 'success',
            message: '✅ Connection successful!',
            details: 'Table "games" does not exist yet (expected if schema not created)',
          })
        } else if (dbError.message.includes('permission denied')) {
          setResult({
            status: 'success',
            message: '✅ Connection successful!',
            details: 'Database accessible (RLS policies may need configuration)',
          })
        } else {
          setResult({
            status: 'error',
            message: '⚠️ Connection works but database error',
            details: dbError.message,
          })
        }
      } else {
        setResult({
          status: 'success',
          message: '✅ Connection successful!',
          details: 'Database and "games" table are accessible',
        })
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: '❌ Connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <div style={{
      padding: '1rem',
      margin: '1rem',
      border: '1px solid #646cff',
      borderRadius: '8px',
      backgroundColor: '#1a1a1a',
      maxWidth: '500px',
    }}>
      <h3 style={{ marginTop: 0 }}>Supabase Connection Test</h3>
      <button
        onClick={testConnection}
        disabled={result.status === 'testing'}
        style={{
          padding: '0.6em 1.2em',
          fontSize: '1em',
          fontWeight: 500,
          borderRadius: '8px',
          border: '1px solid #646cff',
          backgroundColor: result.status === 'testing' ? '#333' : '#1a1a1a',
          color: '#fff',
          cursor: result.status === 'testing' ? 'not-allowed' : 'pointer',
          opacity: result.status === 'testing' ? 0.6 : 1,
        }}
      >
        {result.status === 'testing' ? 'Testing...' : 'Test Supabase Connection'}
      </button>

      {result.status !== 'idle' && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '4px',
          backgroundColor:
            result.status === 'success'
              ? 'rgba(0, 255, 0, 0.1)'
              : result.status === 'error'
              ? 'rgba(255, 0, 0, 0.1)'
              : 'rgba(255, 255, 0, 0.1)',
          border: `1px solid ${
            result.status === 'success'
              ? 'rgba(0, 255, 0, 0.3)'
              : result.status === 'error'
              ? 'rgba(255, 0, 0, 0.3)'
              : 'rgba(255, 255, 0, 0.3)'
          }`,
        }}>
          <div style={{ fontWeight: 500, marginBottom: result.details ? '0.5rem' : 0 }}>
            {result.message}
          </div>
          {result.details && (
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
              {result.details}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

