import { supabase } from './supabase'

export default {
    /**
     * Obtiene todas las planificaciones desde Supabase con sus relaciones resueltas
     */
    async obtenerPlanificaciones() {
        try {
            const { data, error } = await supabase
                .from('planificaciones')
                .select(`
                    id,
                    operador_id,
                    fecha,
                    creado_en,
                    usuarios (
                        nombre
                    ),
                    planificacion_recetas (
                        cantidad,
                        recetas (
                            id,
                            nombre
                        )
                    )
                `)
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                operadorId: item.operador_id,
                operadorNombre: item.usuarios?.nombre || 'Operador Desconocido',
                fecha: item.fecha,
                creado_en: item.creado_en,
                recetas: (item.planificacion_recetas || []).map(pr => ({
                    recetaId: pr.recetas?.id,
                    nombre: pr.recetas?.nombre || 'Receta Desconocida',
                    cantidad: pr.cantidad
                }))
            }));
        } catch (error) {
            console.error('Error al obtener planificaciones desde Supabase:', error);
            throw error;
        }
    },

    /**
     * Obtiene las planificaciones de un operador específico
     */
    async obtenerPlanificacionesPorOperador(operadorId) {
        try {
            const { data, error } = await supabase
                .from('planificaciones')
                .select(`
                    id,
                    operador_id,
                    fecha,
                    creado_en,
                    usuarios (
                        nombre
                    ),
                    planificacion_recetas (
                        cantidad,
                        recetas (
                            id,
                            nombre
                        )
                    )
                `)
                .eq('operador_id', operadorId)
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                operadorId: item.operador_id,
                operadorNombre: item.usuarios?.nombre || 'Operador Desconocido',
                fecha: item.fecha,
                creado_en: item.creado_en,
                recetas: (item.planificacion_recetas || []).map(pr => ({
                    recetaId: pr.recetas?.id,
                    nombre: pr.recetas?.nombre || 'Receta Desconocida',
                    cantidad: pr.cantidad
                }))
            }));
        } catch (error) {
            console.error('Error al obtener planificaciones del operador desde Supabase:', error);
            throw error;
        }
    },

    /**
     * Crea una nueva planificación y sus relaciones en Supabase.
     * Con la Migración B activa, lanzará un error si el operador ya tiene
     * planificación para esa fecha (UNIQUE constraint).
     * @param {{ operadorId: string, operadorNombre: string, fecha: string, recetas: Array<{ recetaId: string, nombre: string, cantidad: number }> }} data
     */
    async crearPlanificacion(data) {
        try {
            const { data: planData, error: planError } = await supabase
                .from('planificaciones')
                .insert({
                    operador_id: data.operadorId,
                    fecha: data.fecha,
                    creado_en: data.creado_en || new Date().toISOString()
                })
                .select()
                .single();

            if (planError) throw planError;

            const planId = planData.id;

            if (data.recetas && data.recetas.length > 0) {
                const insertRecetas = data.recetas.map(r => ({
                    planificacion_id: planId,
                    receta_id: r.recetaId,
                    cantidad: parseInt(r.cantidad) || 0
                }));

                const { error: relError } = await supabase
                    .from('planificacion_recetas')
                    .insert(insertRecetas);

                if (relError) throw relError;
            }

            return {
                id: planId,
                operadorId: planData.operador_id,
                operadorNombre: data.operadorNombre,
                fecha: planData.fecha,
                creado_en: planData.creado_en,
                recetas: data.recetas || []
            };
        } catch (error) {
            console.error('Error al crear planificación en Supabase:', error);
            throw error;
        }
    },

    /**
     * Elimina una planificación por ID (ON DELETE CASCADE se encarga de los detalles)
     */
    async eliminarPlanificacion(id) {
        try {
            const { error } = await supabase
                .from('planificaciones')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error al eliminar planificación en Supabase:', error);
            throw error;
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MÉTODOS PARA ASIGNACIÓN AUTOMÁTICA
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Obtiene todos los pedidos con estado='Pendiente' para una fecha dada
     * y los agrupa por receta, sumando el total de stems de cada una.
     * @param {string} fecha — formato 'YYYY-MM-DD'
     * @returns {Array<{ recetaId: string, nombre: string, categoria: string, totalStems: number }>}
     */
    async obtenerPedidosPendientesPorFecha(fecha) {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    id,
                    fecha_pedido,
                    estado,
                    cliente_facturacion:cliente_facturacion_id ( nombre ),
                    pedido_detalles (
                        stems,
                        recetas (
                            id,
                            nombre,
                            categoria
                        )
                    )
                `)
                .eq('fecha_pedido', fecha)
                .eq('estado', 'Pendiente');

            if (error) throw error;

            // Agrupar por receta_id sumando stems
            const mapaRecetas = new Map();

            for (const pedido of (data || [])) {
                for (const detalle of (pedido.pedido_detalles || [])) {
                    const receta = detalle.recetas;
                    if (!receta) continue;

                    const stems = parseInt(detalle.stems) || 0;
                    const clienteNombre = pedido.cliente_facturacion?.nombre || 'Cliente Desconocido';

                    if (mapaRecetas.has(receta.id)) {
                        const entry = mapaRecetas.get(receta.id);
                        entry.totalStems += stems;

                        // Agregar el pedido de forma única si no está ya
                        const pedExistente = entry.pedidos.find(p => p.pedidoId === pedido.id);
                        if (pedExistente) {
                            pedExistente.stems += stems;
                        } else {
                            entry.pedidos.push({
                                pedidoId: pedido.id,
                                cliente: clienteNombre,
                                categoria: receta.categoria || '',
                                stems: stems
                            });
                        }
                    } else {
                        mapaRecetas.set(receta.id, {
                            recetaId: receta.id,
                            nombre: receta.nombre || 'Receta Desconocida',
                            categoria: receta.categoria || '',
                            totalStems: stems,
                            pedidos: [{
                                pedidoId: pedido.id,
                                cliente: clienteNombre,
                                categoria: receta.categoria || '',
                                stems: stems
                            }]
                        });
                    }
                }
            }

            // Ordenar de mayor a menor stems para que el algoritmo sea más eficiente
            return Array.from(mapaRecetas.values())
                .sort((a, b) => b.totalStems - a.totalStems);

        } catch (error) {
            console.error('Error al obtener pedidos pendientes por fecha:', error);
            throw error;
        }
    },

    /**
     * Algoritmo Greedy Least-Loaded:
     * Distribuye los grupos de recetas entre los operadores de forma equitativa
     * asignando siempre la siguiente receta al operador con menos stems acumulados.
     *
     * @param {Array<{ id: string, nombre: string }>} operadores
     * @param {Array<{ recetaId: string, nombre: string, categoria: string, totalStems: number }>} gruposReceta
     * @returns {Array<{ operador: object, recetas: Array, stemsTotal: number }>}
     */
    distribuirEquitativamente(operadores, gruposReceta) {
        if (!operadores.length || !gruposReceta.length) return [];

        // Inicializar carga de cada operador en 0
        const carga = operadores.map(op => ({
            operador: op,
            recetas: [],
            stemsTotal: 0
        }));

        // Greedy: asignar cada grupo de receta al operador con menos stems
        for (const grupo of gruposReceta) {
            // Encontrar el operador con menor carga acumulada
            carga.sort((a, b) => a.stemsTotal - b.stemsTotal);
            const destino = carga[0];

            destino.recetas.push({
                recetaId: grupo.recetaId,
                nombre: grupo.nombre,
                cantidad: grupo.totalStems  // cantidad = stems totales del pedido
            });
            destino.stemsTotal += grupo.totalStems;
        }

        // Filtrar operadores sin asignación (más operadores que recetas)
        return carga.filter(c => c.recetas.length > 0);
    },

    /**
     * Guarda en batch las planificaciones calculadas automáticamente.
     * Si se pasa mapeoCategorias, actualiza primero los pedido_detalles de Supabase
     * para mapear la categoría a la receta seleccionada.
     *
     * @param {Array<{ operador, recetas, stemsTotal }>} distribuciones
     * @param {string} fecha
     * @param {Object} mapeoCategorias — { [categoria]: recetaId }
     * @returns {{ exitosos: number, fallidos: Array<{ nombre: string, motivo: string }> }}
     */
    async crearPlanificacionesMasivas(distribuciones, fecha, mapeoCategorias = null) {
        // 1. Si se pasó un mapeo de categorías, actualizar primero los detalles de los pedidos
        if (mapeoCategorias && Object.keys(mapeoCategorias).length > 0) {
            try {
                // Obtener todos los pedidos pendientes con sus detalles y recetas
                const { data: pendingOrders, error: fetchError } = await supabase
                    .from('pedidos')
                    .select(`
                        id,
                        pedido_detalles (
                            stems,
                            recetas (
                                id,
                                categoria
                            )
                        )
                    `)
                    .eq('fecha_pedido', fecha)
                    .eq('estado', 'Pendiente');

                if (!fetchError && pendingOrders) {
                    const nuevosDetalles = [];
                    const orderIdsToClean = [];

                    // Agrupar los detalles de pedidos de cada categoría
                    const detallesPorCategoria = {}; // { [categoria]: [ { orderId, stems, originalRecetaId } ] }

                    for (const order of pendingOrders) {
                        for (const det of (order.pedido_detalles || [])) {
                            const catName = det.recetas?.categoria;
                            if (catName) {
                                if (!detallesPorCategoria[catName]) {
                                    detallesPorCategoria[catName] = [];
                                }
                                detallesPorCategoria[catName].push({
                                    orderId: order.id,
                                    stems: parseInt(det.stems) || 0,
                                    originalRecetaId: det.recetas.id
                                });
                            }
                            orderIdsToClean.push(order.id);
                        }
                    }

                    // Limpiar duplicados de orderIdsToClean
                    const uniqueOrderIds = [...new Set(orderIdsToClean)];

                    // Realizar la distribución por categoría
                    for (const catName of Object.keys(detallesPorCategoria)) {
                        const orderDetails = detallesPorCategoria[catName];
                        const mappings = mapeoCategorias[catName]; // Array de { recetaId, stems }

                        if (mappings && Array.isArray(mappings) && mappings.length > 0) {
                            // Clonamos las capacidades para modificarlas
                            const targetRecipes = mappings.map(m => ({ recetaId: m.recetaId, capacity: parseInt(m.stems) || 0 }));
                            let recipeIdx = 0;

                            for (const det of orderDetails) {
                                let remainingStems = det.stems;
                                while (remainingStems > 0 && recipeIdx < targetRecipes.length) {
                                    const currentRecipe = targetRecipes[recipeIdx];
                                    const allocatedStems = Math.min(remainingStems, currentRecipe.capacity);

                                    if (allocatedStems > 0) {
                                        nuevosDetalles.push({
                                            pedido_id: det.orderId,
                                            receta_id: currentRecipe.recetaId,
                                            stems: allocatedStems,
                                            cantidad: 1
                                        });
                                        currentRecipe.capacity -= allocatedStems;
                                        remainingStems -= allocatedStems;
                                    }

                                    if (currentRecipe.capacity <= 0) {
                                        recipeIdx++;
                                    }
                                }

                                // Si queda algo sin asignar, lo asignamos a la última receta
                                if (remainingStems > 0) {
                                    const lastRecipeId = targetRecipes[targetRecipes.length - 1]?.recetaId || targetRecipes[0]?.recetaId;
                                    if (lastRecipeId) {
                                        nuevosDetalles.push({
                                            pedido_id: det.orderId,
                                            receta_id: lastRecipeId,
                                            stems: remainingStems,
                                            cantidad: 1
                                        });
                                    }
                                }
                            }
                        } else {
                            // Conservar los detalles originales si no hay mapeo
                            for (const det of orderDetails) {
                                nuevosDetalles.push({
                                    pedido_id: det.orderId,
                                    receta_id: det.originalRecetaId,
                                    stems: det.stems,
                                    cantidad: 1
                                });
                            }
                        }
                    }

                    if (uniqueOrderIds.length > 0 && nuevosDetalles.length > 0) {
                        // Limpiar detalles antiguos de estos pedidos
                        await supabase
                            .from('pedido_detalles')
                            .delete()
                            .in('pedido_id', uniqueOrderIds);

                        // Insertar los nuevos detalles actualizados con la receta elegida
                        await supabase
                            .from('pedido_detalles')
                            .insert(nuevosDetalles);
                    }
                }
            } catch (err) {
                console.error("Error al actualizar recetas de los detalles de pedidos:", err);
            }
        }

        // 2. Guardar las planificaciones masivas normales
        const promesas = distribuciones.map(dist =>
            this.crearPlanificacion({
                operadorId: dist.operador.id,
                operadorNombre: dist.operador.nombre,
                fecha,
                recetas: dist.recetas
            })
        );

        const resultados = await Promise.allSettled(promesas);

        const exitosos = resultados.filter(r => r.status === 'fulfilled').length;
        const fallidos = resultados
            .map((r, i) => r.status === 'rejected'
                ? {
                    nombre: distribuciones[i].operador.nombre,
                    motivo: r.reason?.message?.includes('duplicate')
                        ? `Ya tiene planificación para esta fecha`
                        : (r.reason?.message || 'Error desconocido')
                }
                : null
            )
            .filter(Boolean);

        // 3. Si hubo planificaciones guardadas con éxito, asignar los pedidos correspondientes a los operadores
        if (exitosos > 0) {
            try {
                // Obtener todos los detalles de los pedidos de esa fecha
                const { data: pedidosDetalles, error: detError } = await supabase
                    .from('pedidos')
                    .select(`
                        id,
                        pedido_detalles (
                            stems,
                            receta_id
                        )
                    `)
                    .eq('fecha_pedido', fecha)
                    .eq('estado', 'Pendiente');

                if (!detError && pedidosDetalles) {
                    const updates = [];
                    for (const pedido of pedidosDetalles) {
                        const stemsPorOperador = new Map(); // operadorId -> stems

                        for (const det of (pedido.pedido_detalles || [])) {
                            // Buscar qué operador tiene esta receta asignada en la distribución
                            const distAsignada = distribuciones.find(d =>
                                d.recetas.some(r => r.recetaId === det.receta_id)
                            );
                            if (distAsignada) {
                                const opId = distAsignada.operador.id;
                                stemsPorOperador.set(opId, (stemsPorOperador.get(opId) || 0) + det.stems);
                            }
                        }

                        // Encontrar el operador con más stems en este pedido
                        let maxStems = -1;
                        let operadorElegidoId = null;
                        stemsPorOperador.forEach((stems, opId) => {
                            if (stems > maxStems) {
                                maxStems = stems;
                                operadorElegidoId = opId;
                            }
                        });

                        if (operadorElegidoId) {
                            updates.push(
                                supabase
                                    .from('pedidos')
                                    .update({ operador_id: operadorElegidoId })
                                    .eq('id', pedido.id)
                            );
                        }
                    }

                    if (updates.length > 0) {
                        await Promise.allSettled(updates);
                    }
                }
            } catch (err) {
                console.error("Error al actualizar la asignación de operadores en los pedidos:", err);
            }
        }

        return { exitosos, fallidos };
    },

    /**
     * Obtiene los pedidos pendientes agrupados puramente por nombre de categoría
     * @param {string} fecha
     */
    async obtenerPedidosAgrupadosPorCategoria(fecha) {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    id,
                    fecha_pedido,
                    estado,
                    cliente_facturacion:cliente_facturacion_id ( nombre ),
                    pedido_detalles (
                        stems,
                        recetas (
                            id,
                            nombre,
                            categoria
                        )
                    )
                `)
                .eq('fecha_pedido', fecha)
                .eq('estado', 'Pendiente');

            if (error) throw error;

            const mapaCategorias = new Map();

            for (const pedido of (data || [])) {
                for (const detalle of (pedido.pedido_detalles || [])) {
                    const receta = detalle.recetas;
                    if (!receta) continue;

                    const categoria = String(receta.categoria || '').trim();
                    if (!categoria) continue;

                    const stems = parseInt(detalle.stems) || 0;
                    const clienteNombre = pedido.cliente_facturacion?.nombre || 'Cliente Desconocido';

                    if (mapaCategorias.has(categoria)) {
                        const entry = mapaCategorias.get(categoria);
                        entry.totalStems += stems;

                        const pedExistente = entry.pedidos.find(p => p.pedidoId === pedido.id);
                        if (pedExistente) {
                            pedExistente.stems += stems;
                        } else {
                            entry.pedidos.push({
                                pedidoId: pedido.id,
                                cliente: clienteNombre,
                                categoria: categoria,
                                stems: stems
                            });
                        }

                        // Acumular tallos por receta_id para pre-llenar el mapeo
                        const recetaExistente = entry.recetasMapeadas.find(r => r.recetaId === receta.id);
                        if (recetaExistente) {
                            recetaExistente.stems += stems;
                        } else {
                            entry.recetasMapeadas.push({
                                recetaId: receta.id,
                                stems: stems
                            });
                        }
                    } else {
                        mapaCategorias.set(categoria, {
                            categoria: categoria,
                            totalStems: stems,
                            pedidos: [{
                                pedidoId: pedido.id,
                                cliente: clienteNombre,
                                categoria: categoria,
                                stems: stems
                            }],
                            recetasMapeadas: [{
                                recetaId: receta.id,
                                stems: stems
                            }]
                        });
                    }
                }
            }

            return Array.from(mapaCategorias.values())
                .sort((a, b) => b.totalStems - a.totalStems);
        } catch (error) {
            console.error('Error al obtener pedidos agrupados por categoría:', error);
            throw error;
        }
    }
}
