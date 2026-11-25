import { supabase } from './supabase'

export default {
  // LOGIN — Usa Supabase Auth nativo
  async login(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      // Obtener datos del usuario de la app (rol, nombre, id)
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre, rol')
        .eq('auth_user_id', authData.user.id)
        .single()

      if (userError) throw userError

      return { success: true, data: usuario }
    } catch (error) {
      console.error("Error al autenticar:", error)
      const esCredenciales = error?.status === 400 ||
        error?.message?.includes('Invalid login credentials')
      return {
        success: false,
        error,
        errorTipo: esCredenciales ? 'credenciales' : 'conexion'
      }
    }
  },

  // LOGOUT — Cierra sesión de Supabase Auth
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      return { success: false, error }
    }
  },

  // SESSION — Verifica si hay sesión activa
  async obtenerSesion() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) return { success: true, data: null }

      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre, rol')
        .eq('auth_user_id', session.user.id)
        .single()

      if (userError) throw userError

      return { success: true, data: usuario }
    } catch (error) {
      console.error("Error al obtener sesión:", error)
      return { success: false, error }
    }
  },

  // Obtener lista de usuarios (sin contraseña)
  async obtenerUsuarios() {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, rol, email')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      return { success: false, error }
    }
  },

  // Crear usuario — Llama a Edge Function (seguro, sin exponer service_role_key)
  async agregarUsuario(usuario) {
    try {
      const { data, error } = await supabase.functions.invoke('crear-usuario', {
        body: {
          email: usuario.email,
          password: usuario.password,
          nombre: usuario.nombre,
          rol: usuario.rol
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return { success: true, data }
    } catch (error) {
      console.error("Error al agregar usuario:", error)
      return { success: false, error }
    }
  },

  // Eliminar usuario — Vía RPC (Soft Delete y limpieza de auth.users)
  async eliminarUsuario(id) {
    try {
      const { error } = await supabase.rpc('rpc_desactivar_usuario', {
        usuario_id_a_dar_de_baja: id
      })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      return { success: false, error }
    }
  },

  // Cambiar contraseña de usuario — Vía RPC (Solo supervisores)
  async cambiarContrasena(id, nuevaContrasena) {
    try {
      const { error } = await supabase.rpc('rpc_cambiar_contrasena_usuario', {
        p_usuario_id: id,
        p_nueva_contrasena: nuevaContrasena
      })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error)
      return { success: false, error }
    }
  }
}
