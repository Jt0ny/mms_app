import { supabase } from './supabase'

export default {
  // Obtiene un usuario por nombre y contraseña encriptada (Alternativa 2)
  async login(nombre, contrasenaEncriptada) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, rol')
        .ilike('nombre', nombre)
        .eq('contrasena', contrasenaEncriptada)
        .maybeSingle()

      if (error) throw error
      return data // Retorna el usuario si coincide, o null si no existe
    } catch (error) {
      console.error("Error al autenticar usuario:", error)
      throw error
    }
  },

  // Obtiene todos los usuarios ordenados por nombre
  async obtenerUsuarios() {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, rol')
        .order('nombre', { ascending: true })

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      throw error
    }
  },

  // Agrega un nuevo usuario (Supabase genera el id automáticamente como UUID)
  async agregarUsuario(usuario) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([{
          nombre: usuario.nombre,
          contrasena: usuario.contrasena,
          rol: usuario.rol
        }])
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error("Error al agregar usuario:", error)
      throw error
    }
  },

  // Obtiene un usuario específico por su UUID
  async obtenerUsuario(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error al obtener usuario:", error)
      throw error
    }
  },

  // Actualiza los datos de un usuario
  async actualizarUsuario(id, usuario) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          nombre: usuario.nombre,
          contrasena: usuario.contrasena,
          rol: usuario.rol
        })
        .eq('id', id)
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      throw error
    }
  },

  // Elimina un usuario por su UUID
  async eliminarUsuario(id) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      throw error
    }
  }
}
