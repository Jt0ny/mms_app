import { supabase } from '../supabase'

export default {
    /**
     * Obtiene la lista de producciones registradas en Supabase
     */
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
            
            return (data || []).map(p => ({
                id: p.id,
                fecha: p.fecha,
                total: p.total,
                operador_id: p.operador_id,
                operadorNombre: p.usuarios?.nombre || '',
                creado_en: p.creado_en,
                detalle: p.detalle || []
            }));
        } catch (error) {
            console.error('Error al obtener producciones:', error);
            throw error;
        }
    },

    /**
     * Registra una nueva producción, descuenta materias primas y materiales,
     * y genera el registro en la tabla de consumos históricos de Supabase.
     */
    async agregarProduccion(payload) {
        try {
            // 1. Insertar cabecera de producción
            const { data: prod, error: prodError } = await supabase
                .from('producciones')
                .insert([{
                    fecha: payload.fecha,
                    total: payload.total,
                    operador_id: payload.operador_id || null
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
            if (payload.operador_id) {
                const { data: plan } = await supabase
                    .from('planificaciones')
                    .select(`
                        id,
                        planificacion_recetas (
                            receta_id
                        )
                    `)
                    .eq('operador_id', payload.operador_id)
                    .eq('fecha', payload.fecha)
                    .maybeSingle();

                if (plan && plan.planificacion_recetas) {
                    recetasPlanificadasIds = plan.planificacion_recetas.map(pr => pr.receta_id);
                }
            }

            const consumosInsertar = [];

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

                console.log(`[ProduccionClient] Categoría: "${d.categoria}". Receta seleccionada para descuento: "${recetaElegida?.nombre}" (ID: ${recetaElegida?.id})`);
                console.log(`[ProduccionClient] Materia prima de la receta:`, recetaElegida?.receta_materia_prima);
                console.log(`[ProduccionClient] Materiales de la receta:`, recetaElegida?.receta_materiales);

                // 3a. Descontar y preparar consumo de Materia Prima (Tallos)
                for (const rm of (recetaElegida.receta_materia_prima || [])) {
                    const stemsConsumidos = rm.cantidad * cantProducida;

                    // Obtener stock actual de la materia prima
                    const { data: stockMP } = await supabase
                        .from('materia_prima')
                        .select('cantidad_total')
                        .eq('id', rm.materia_prima_id)
                        .single();

                    if (stockMP) {
                        const nuevoStock = Math.max(0, (stockMP.cantidad_total || 0) - stemsConsumidos);
                        await supabase
                            .from('materia_prima')
                            .update({ cantidad_total: nuevoStock })
                            .eq('id', rm.materia_prima_id);

                        consumosInsertar.push({
                            produccion_id: prod.id,
                            tipo: 'materia_prima',
                            materia_prima_id: rm.materia_prima_id,
                            material_id: null,
                            cantidad_consumida: stemsConsumidos
                        });
                    }
                }

                // 3b. Descontar y preparar consumo de Materiales (Ligas, capuchones, cartón)
                for (const mat of (recetaElegida.receta_materiales || [])) {
                    const insumosConsumidos = mat.cantidad * cantProducida;

                    // Obtener stock actual del material
                    const { data: stockMat } = await supabase
                        .from('materiales')
                        .select('cantidad')
                        .eq('id', mat.material_id)
                        .single();

                    if (stockMat) {
                        const nuevoStock = Math.max(0, (stockMat.cantidad || 0) - insumosConsumidos);
                        await supabase
                            .from('materiales')
                            .update({ cantidad: nuevoStock })
                            .eq('id', mat.material_id);

                        consumosInsertar.push({
                            produccion_id: prod.id,
                            tipo: 'material',
                            materia_prima_id: null,
                            material_id: mat.material_id,
                            cantidad_consumida: insumosConsumidos
                        });
                    }
                }
            }

            // 4. Registrar todos los consumos en la tabla histórica
            if (consumosInsertar.length > 0) {
                const { error: consError } = await supabase
                    .from('produccion_consumos')
                    .insert(consumosInsertar);

                if (consError) throw consError;
            }

            return prod;
        } catch (error) {
            console.error('Error al agregar producción con descuento de stock:', error);
            throw error;
        }
    },

    /**
     * Edita cabecera y detalles de una producción registrada
     */
    async editarProduccion(id, payload) {
        try {
            // Actualizar la cabecera
            const { error: prodError } = await supabase
                .from('producciones')
                .update({
                    fecha: payload.fecha,
                    total: payload.total
                })
                .eq('id', id);

            if (prodError) throw prodError;

            // Borrar detalles viejos
            const { error: delError } = await supabase
                .from('produccion_detalle')
                .delete()
                .eq('produccion_id', id);

            if (delError) throw delError;

            // Insertar detalles nuevos
            const detallesPayload = payload.detalle.map(d => ({
                produccion_id: id,
                categoria: d.categoria,
                cantidad: d.cantidad
            }));

            const { error: insError } = await supabase
                .from('produccion_detalle')
                .insert(detallesPayload);

            if (insError) throw insError;

            return { id };
        } catch (error) {
            console.error('Error al editar producción:', error);
            throw error;
        }
    },

    /**
     * Elimina un registro de producción por ID
     */
    async eliminarProduccion(id) {
        try {
            const { error } = await supabase
                .from('producciones')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error al eliminar producción:', error);
            throw error;
        }
    }
}