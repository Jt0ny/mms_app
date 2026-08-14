import { supabase } from "./supabase";
import { obtenerFechaHoy } from "../utils/date.js";

export default {
    /**
     * Verifica si ya se realizó una sincronización hoy para el módulo indicado.
     * @param {string} modulo El nombre del módulo (ej: "pedidos", "materia_prima", "materiales")
     * @returns {Promise<boolean>} true si ya se sincronizó hoy, false en caso contrario
     */
    async yaSincronizadoHoy(modulo) {
        try {
            const hoy = obtenerFechaHoy();
            const { data, error } = await supabase
                .from('sync_log')
                .select('id')
                .eq('modulo', modulo)
                .eq('fecha_sync', hoy);

            if (error) throw error;
            return data && data.length > 0;
        } catch (error) {
            console.error(`Error al verificar sync_log para ${modulo}:`, error);
            return false; // En caso de error, permitimos sincronizar
        }
    },

    /**
     * Registra una sincronización exitosa en el día actual para el módulo indicado.
     * @param {string} modulo El nombre del módulo (ej: "pedidos", "materia_prima", "materiales")
     */
    async registrarSync(modulo) {
        try {
            const hoy = obtenerFechaHoy();
            
            // Verificamos si ya existe para no duplicar entradas por si acaso
            const yaRegistrado = await this.yaSincronizadoHoy(modulo);
            if (yaRegistrado) return { success: true };

            const { error } = await supabase
                .from('sync_log')
                .insert([{ modulo: modulo, fecha_sync: hoy }]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Error al registrar sync_log para ${modulo}:`, error);
            return { success: false, error };
        }
    }
}
