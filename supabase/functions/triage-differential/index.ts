import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { intake, patient_context } = await req.json()

    // Call the Python FastAPI backend
    const apiUrl = Deno.env.get('FASTAPI_URL') || 'https://your-api.onrender.com'
    const response = await fetch(`${apiUrl}/api/triage/differential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intake, patient_context })
    })

    const data = await response.json()

    // Store triage session in Supabase
    const { data: session, error } = await supabaseClient
      .from('triage_sessions')
      .insert({
        intake,
        patient_context,
        differential: data.differential,
        red_flags: data.red_flags,
        suggested_actions: data.suggested_actions,
        clinical_summary: data.clinical_summary,
        model_used: data.model_used,
        status: 'pending_review'
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ ...data, session_id: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}