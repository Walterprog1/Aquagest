import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  try {
    const { titulo, cuerpo } = await req.json()
    
    if (!titulo || !cuerpo) {
      return new Response(
        JSON.stringify({ success: false, message: 'Faltan parametros' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase.rpc('registrar_pago_alquiler', {
      p_titulo: titulo,
      p_cuerpo: cuerpo
    })

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
