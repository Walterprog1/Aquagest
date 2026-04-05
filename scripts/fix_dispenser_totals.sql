-- ============================================
-- CORRECCIÓN DE TOTALES PARA PEDIDOS DE DISPENSER
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- Paso 1: Verificar dispensers instalados
SELECT d.id, d.cliente_id, d.estado, c.nombre as cliente_nombre
FROM dispensers d
JOIN clientes c ON d.cliente_id = c.id
WHERE LOWER(d.estado) LIKE '%instalado%';

-- Paso 2: Ver pedidos que podrían necesitar corrección
-- (Los que tienen total > 0 pero deberían ser 0 por estar dentro del cupo gratis)
SELECT 
    p.id,
    p.cliente_id,
    p.fecha,
    p.total as total_actual,
    dp.cantidad as bidones,
    dp.precio_unitario
FROM pedidos p
JOIN detalles_pedido dp ON p.id = dp.pedido_id
JOIN dispensers d ON p.cliente_id = d.cliente_id
WHERE LOWER(d.estado) LIKE '%instalado%'
    AND p.estado = 'Entregado'
    AND (
        dp.producto ILIKE '%bidon%' 
        OR dp.producto ILIKE '%bidón%' 
        OR dp.producto ILIKE '%20l%'
    )
ORDER BY p.cliente_id, p.fecha;

-- Paso 3: EJECUTAR CORRECCIÓN
-- Este SQL actualiza los totales de pedidos para clientes con dispenser
-- aplicando la lógica de 3 bidones gratis por mes

DO $$
DECLARE
    r RECORD;
    v_cliente_id UUID;
    v_mes TEXT;
    v_bidones_acum INT := 0;
    v_gratis_restantes INT;
    v_bidones_pedido INT;
    v_precio_unitario NUMERIC;
    v_total_correcto NUMERIC;
    v_pedido_id UUID;
BEGIN
    -- Procesar cada cliente con dispenser
    FOR r IN 
        SELECT DISTINCT p.cliente_id 
        FROM pedidos p
        JOIN dispensers d ON p.cliente_id = d.cliente_id
        WHERE LOWER(d.estado) LIKE '%instalado%'
    LOOP
        v_cliente_id := r.cliente_id;
        v_bidones_acum := 0;
        
        -- Procesar pedidos del cliente ordenados por fecha
        FOR v_pedido_id IN
            SELECT p.id 
            FROM pedidos p
            WHERE p.cliente_id = v_cliente_id
            AND p.estado = 'Entregado'
            ORDER BY p.fecha ASC
        LOOP
            -- Obtener datos del pedido
            SELECT 
                COALESCE(SUM(
                    CASE WHEN LOWER(dp.producto) LIKE '%bidon%' OR LOWER(dp.producto) LIKE '%bidón%' OR LOWER(dp.producto) LIKE '%20l%'
                    THEN dp.cantidad ELSE 0 END
                ), 0),
                COALESCE(dp.precio_unitario, 2500)
            INTO v_bidones_pedido, v_precio_unitario
            FROM detalles_pedido dp
            WHERE dp.pedido_id = v_pedido_id;
            
            -- Calcular grátis restantes en este momento
            v_gratis_restantes := GREATEST(0, 3 - (v_bidones_acum % 3));
            
            -- Calcular total correcto
            v_total_correcto := GREATEST(0, v_bidones_pedido - v_gratis_restantes) * v_precio_unitario;
            
            -- Actualizar si es diferente
            UPDATE pedidos 
            SET total = v_total_correcto 
            WHERE id = v_pedido_id 
            AND total != v_total_correcto;
            
            -- Acumular bidones para el siguiente pedido
            v_bidones_acum := v_bidones_acum + v_bidones_pedido;
        END LOOP;
    END LOOP;
END $$;

-- Paso 4: Verificar resultados después de la corrección
SELECT 
    p.id,
    c.nombre as cliente_nombre,
    p.fecha,
    p.total as total_corregido,
    dp.cantidad as bidones,
    dp.precio_unitario
FROM pedidos p
JOIN detalles_pedido dp ON p.id = dp.pedido_id
JOIN clientes c ON p.cliente_id = c.id
JOIN dispensers d ON p.cliente_id = d.cliente_id
WHERE LOWER(d.estado) LIKE '%instalado%'
    AND p.estado = 'Entregado'
ORDER BY c.nombre, p.fecha;
