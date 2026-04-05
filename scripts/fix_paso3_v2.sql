DO $$
DECLARE
    r RECORD;
    v_cliente_id UUID;
    v_bidones_acum INT := 0;
    v_gratis_restantes INT;
    v_bidones_pedido INT;
    v_precio_unitario NUMERIC;
    v_total_correcto NUMERIC;
    v_pedido_id UUID;
BEGIN
FOR r IN 
    SELECT DISTINCT p.cliente_id 
    FROM pedidos p 
    JOIN dispensers d ON p.cliente_id = d.cliente_id 
    WHERE LOWER(d.estado) LIKE '%instalado%'
LOOP
    v_cliente_id := r.cliente_id;
    v_bidones_acum := 0;
    
    FOR v_pedido_id IN 
        SELECT p.id 
        FROM pedidos p 
        WHERE p.cliente_id = v_cliente_id 
        AND p.estado = 'Entregado' 
        ORDER BY p.fecha ASC
    LOOP
        SELECT 
            COALESCE(
                (SELECT SUM(dp2.cantidad) FROM detalles_pedido dp2 
                 WHERE dp2.pedido_id = v_pedido_id 
                 AND (LOWER(dp2.producto) LIKE '%bidon%' OR LOWER(dp2.producto) LIKE '%bidón%' OR LOWER(dp2.producto) LIKE '%20l%')),
                0
            ),
            COALESCE((SELECT dp2.precio_unitario FROM detalles_pedido dp2 WHERE dp2.pedido_id = v_pedido_id LIMIT 1), 2500)
        INTO v_bidones_pedido, v_precio_unitario;
        
        v_gratis_restantes := GREATEST(0, 3 - (v_bidones_acum % 3));
        v_total_correcto := GREATEST(0, v_bidones_pedido - v_gratis_restantes) * v_precio_unitario;
        
        UPDATE pedidos SET total = v_total_correcto WHERE id = v_pedido_id;
        
        v_bidones_acum := v_bidones_acum + v_bidones_pedido;
    END LOOP;
END LOOP;
END $$;
