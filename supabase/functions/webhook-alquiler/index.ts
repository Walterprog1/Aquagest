import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  let payload = {}

  const logResultado = async (msg: string, exito = false) => {
    await supabase.from('logs_webhook').insert([{
      payload: { url: req.url },
      resultado: msg,
      exito
    }])
    return new Response(msg, { status: 200 })
  }

  try {
    const url = new URL(req.url)
    let texto = url.searchParams.get('texto')

    if (!texto) {
      try {
        payload = await req.json()
        texto = payload.texto
      } catch (e) {}
    }

    if (!texto) return logResultado('No se recibio texto de notificacion', false)

    const textoMin = texto.toLowerCase()

    // Extraer monto
    let montoLimpio = 0
    const match = String(texto).match(/(\d+)/)
    if (match) {
      montoLimpio = parseFloat(match[0])
    }

    if (!montoLimpio || isNaN(montoLimpio) || montoLimpio <= 0) {
      return logResultado(`Monto no detectado en: "${texto}"`, false)
    }

    // Buscar cliente
    const { data: clientes } = await supabase.from('clientes').select('id, nombre, alias_transferencia')

    const clienteEncontrado = clientes?.find(c => {
      const opciones = [c.nombre, ...(c.alias_transferencia ? c.alias_transferencia.split(',') : [])]
      return opciones.some(opcion => {
        const palabras = opcion.toLowerCase().trim().split(/\s+/).filter(p => p.length > 2)
        if (palabras.length === 0) return false
        return palabras.every(palabra => textoMin.includes(palabra))
      })
    })

    if (!clienteEncontrado) return logResultado(`Cliente no identificado: ${texto}`, false)

    // Buscar dispenser instalado
    const { data: dispensers } = await supabase
      .from('dispensers')
      .select('id')
      .eq('cliente_id', clienteEncontrado.id)
      .eq('estado', 'instalado')

    if (!dispensers || dispensers.length === 0) {
      return logResultado(`Cliente sin dispenser instalado: ${clienteEncontrado.nombre}`, false)
    }

    // Verificar si ya hay pago este mes
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0]
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: pagosExistentes } = await supabase
      .from('operaciones')
      .select('id')
      .eq('entidad_referencia', clienteEncontrado.id)
      .eq('categoria', 'Alquiler Dispenser')
      .gte('fecha', inicioMes)
      .lte('fecha', finMes)

    if (pagosExistentes && pagosExistentes.length > 0) {
      return logResultado(`Alquiler ya pagado este mes: ${clienteEncontrado.nombre}`, false)
    }

    // Obtener user
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    if (!userId) {
      return logResultado('No se pudo obtener usuario', false)
    }

    // Registrar pago
    await supabase.from('operaciones').insert([{
      user_id: userId,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'ingreso',
      categoria: 'Alquiler Dispenser',
      monto: montoLimpio,
      concepto: `Alquiler Dispenser - ${clienteEncontrado.nombre} (pago automatico)`,
      metodo_pago: 'transferencia',
      entidad_referencia: clienteEncontrado.id
    }])

    return logResultado(`PAGO ALQUILER OK: ${clienteEncontrado.nombre} ($${montoLimpio})`, true)

  } catch (err) {
    return logResultado(`Error: ${err.message}`, false)
  }
})
