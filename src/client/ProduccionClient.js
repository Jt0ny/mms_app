import { supabase } from './supabase'

export default {
    async obtenerProducciones() {
        try {
            const { data, error } = await supabase
                .from('producciones')
                .select(`
                    id,
                    fecha,
                    total,
                    operador_id,
                    creado_en,
                    usuarios ( nombre ),
                    detalle:produccion_detalle (
                        categoria,
                        cantidad
                    )
                `)
                .order('fecha', { ascending: false });

            if (error) throw error;

            return { success: true, data: (data || []).map(p => ({
                id: p.id,
                fecha: p.fecha,
                total: p.total,
                operadorId: p.operador_id,
                operadorNombre: p.usuarios?.nombre || '',
                creadoEn: p.creado_en,
                detalle: p.detalle || []
            }))};
        } catch (error) {
            console.error('Error al obtener producciones:', error);
            return { success: false, error };
        }
    },

    // Registra una nueva producción, descuenta materias primas y materiales,
    // y genera el registro en la tabla de consumos históricos de Supabase.
    async agregarProduccion(payload) {
        try {
            // 1. Insertar cabecera de producción
            const { data: prod, error: prodError } = await supabase
                .from('producciones')
                .insert([{
                    fecha: payload.fecha,
                    total: payload.total,
                    operador_id: payload.operadorId || null
                }])
                .select()
                .single();

            if (prodError) throw prodError;

            // 2. Insertar detalles de producción por categoría
            const detallesPayload = payload.detalle.map(d => ({
                produccion_id: prod.id,
                categoria: d.categoria,
                cantidad: d.cantidad
            }));

            const { error: detError } = await supabase
                .from('produccion_detalle')
                .insert(detallesPayload);

            if (detError) throw detError;

            // 3. DESCONTAR STOCK Y REGISTRAR CONSUMOS
            // Cargar recetas para mapear la categoría de flor a ingredientes físicos
            const { data: recetas, error: recError } = await supabase
                .from('recetas')
                .select(`
                    id,
                    nombre,
                    categoria,
                    receta_materia_prima (
                        materia_prima_id,
                        cantidad
                    ),
                    receta_materiales (
                        material_id,
                        cantidad
                    )
                `);

            if (recError) throw recError;

            // Consultar planificación del operador para el día de producción (para mapear con mayor precisión)
            let recetasPlanificadasIds = [];
            if (payload.operadorId) {
                const { data: plan } = await supabase
                    .from('planificaciones')
                    .select(`
                        id,
                        planificacion_recetas (
                            receta_id
                        )
                    `)
                    .eq('operador_id', payload.operadorId)
                    .eq('fecha', payload.fecha)
                    .maybeSingle();

                if (plan && plan.planificacion_recetas) {
                    recetasPlanificadasIds = plan.planificacion_recetas.map(pr => pr.receta_id);
                }
            }

            const consumosInsertar = [];
            const consumosMP = new Map();
            const consumosMat = new Map();

            for (const d of payload.detalle) {
                const cantProducida = parseInt(d.cantidad) || 0;
                if (cantProducida <= 0) continue;

                // Buscar recetas elegibles para esta categoría
                const recetasCategoria = (recetas || []).filter(r =>
                    String(r.categoria).toLowerCase().trim() === String(d.categoria).toLowerCase().trim()
                );

                if (recetasCategoria.length === 0) continue;

                // Elegir la mejor receta para el descuento de stock:
                // Prioridad 1: Receta planificada que tenga ingredientes configurados
                // Prioridad 2: Cualquier receta en esta categoría que tenga ingredientes configurados
                // Prioridad 3: La receta planificada (aunque esté vacía)
                // Prioridad 4: La primera receta de esta categoría
                let recetaElegida = recetasCategoria.find(r =>
                    recetasPlanificadasIds.includes(r.id) &&
                    ((r.receta_materia_prima && r.receta_materia_prima.length > 0) ||
                        (r.receta_materiales && r.receta_materiales.length > 0))
                );

                if (!recetaElegida) {
                    recetaElegida = recetasCategoria.find(r =>
                        (r.receta_materia_prima && r.receta_materia_prima.length > 0) ||
                        (r.receta_materiales && r.receta_materiales.length > 0)
                    );
                }

                if (!recetaElegida) {
                    recetaElegida = recetasCategoria.find(r => recetasPlanificadasIds.includes(r.id));
                }

                if (!recetaElegida) {
                    recetaElegida = recetasCategoria[0];
                }



                // 3a. Acumular consumo de Materia Prima (Tallos)
                for (const rm of (recetaElegida.receta_materia_prima || [])) {
                    const mpId = rm.materia_prima_id || rm.id;
                    if (!mpId) continue;
                    const stemsConsumidos = rm.cantidad * cantProducida;

                    const actual = consumosMP.get(mpId) || 0;
                    consumosMP.set(mpId, actual + stemsConsumidos);

                    consumosInsertar.push({
                        produccion_id: prod.id,
                        tipo: 'materia_prima',
                        materia_prima_id: mpId,
                        material_id: null,
                        cantidad_consumida: stemsConsumidos
                    });
                }

                // 3b. Acumular consumo de Materiales (Ligas, capuchones, cartón)
                for (const mat of (recetaElegida.receta_materiales || [])) {
                    const matId = mat.material_id || mat.id;
                    if (!matId) continue;
                    const insumosConsumidos = mat.cantidad * cantProducida;

                    const actual = consumosMat.get(matId) || 0;
                    consumosMat.set(matId, actual + insumosConsumidos);

                    consumosInsertar.push({
                        produccion_id: prod.id,
                        tipo: 'material',
                        materia_prima_id: null,
                        material_id: matId,
                        cantidad_consumida: insumosConsumidos
                    });
                }
            }

            // 4. Obtener stocks actuales en bloque y preparar actualizaciones
            const updatePromises = [];
            const mpIds = Array.from(consumosMP.keys());
            const matIds = Array.from(consumosMat.keys());

            if (mpIds.length > 0) {
                const { data: stocksMP } = await supabase
                    .from('materia_prima')
                    .select('id, cantidad_total')
                    .in('id', mpIds);

                for (const stock of (stocksMP || [])) {
                    const consumido = consumosMP.get(stock.id) || 0;
                    const nuevoStock = Math.max(0, (stock.cantidad_total || 0) - consumido);
                    updatePromises.push(
                        supabase.from('materia_prima').update({ cantidad_total: nuevoStock }).eq('id', stock.id)
                    );
                }
            }

            if (matIds.length > 0) {
                const { data: stocksMat } = await supabase
                    .from('materiales')
                    .select('id, cantidad')
                    .in('id', matIds);

                for (const stock of (stocksMat || [])) {
                    const consumido = consumosMat.get(stock.id) || 0;
                    const nuevoStock = Math.max(0, (stock.cantidad || 0) - consumido);
                    updatePromises.push(
                        supabase.from('materiales').update({ cantidad: nuevoStock }).eq('id', stock.id)
                    );
                }
            }

            // Ejecutar todas las actualizaciones de stock en paralelo
            if (updatePromises.length > 0) {
                await Promise.all(updatePromises);
            }

            // 5. Registrar todos los consumos en la tabla histórica
            if (consumosInsertar.length > 0) {
                const { error: consError } = await supabase
                    .from('produccion_consumos')
                    .insert(consumosInsertar);

                if (consError) throw consError;
            }

            return { success: true, data: prod };
        } catch (error) {
            console.error('Error al agregar producción con descuento de stock:', error);
            return { success: false, error };
        }
    },

    async editarProduccion(id, payload) {
        try {
            // 1. Actualizar la cabecera
            const { error: prodError } = await supabase
                .from('producciones')
                .update({
                    fecha: payload.fecha,
                    total: payload.total
                })
                .eq('id', id);

            if (prodError) throw prodError;

            // 2. Borrar detalles viejos
            const { error: delError } = await supabase
                .from('produccion_detalle')
                .delete()
                .eq('produccion_id', id);

            if (delError) throw delError;

            // 3. Insertar detalles nuevos
            const detallesPayload = payload.detalle.map(d => ({
                produccion_id: id,
                categoria: d.categoria,
                cantidad: d.cantidad
            }));

            const { error: insError } = await supabase
                .from('produccion_detalle')
                .insert(detallesPayload);

            if (insError) throw insError;

            return { success: true, data: { id } };
        } catch (error) {
            console.error('Error al editar producción:', error);
            return { success: false, error };
        }
    },

    async eliminarProduccion(id) {
        try {
            const { error } = await supabase
                .from('producciones')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar producción:', error);
            return { success: false, error };
        }
    }
}