import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar que el caller sea un supervisor
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Validar token y verificar rol con una sola llamada RPC
    const { data: rol, error: userError } = await supabaseClient.rpc('get_user_rol')
    
    if (userError || rol !== 'supervisor') {
      throw new Error('No autorizado: Solo supervisores pueden crear usuarios')
    }

    // Crear usuario con service_role
    const { email, password, nombre, rol: rolNuevo } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirmar email automáticamente
    })

    if (authError) throw authError

    // Insertar en public.usuarios vinculado
    const { data: usuario, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        nombre,
        rol: rolNuevo,
        email,
        auth_user_id: authUser.user.id
      })
      .select()
      .single()

    if (dbError) {
      // Rollback: eliminar el usuario de auth si falla el insert
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw dbError
    }

    return new Response(JSON.stringify(usuario), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
