-- Funcion simplificada para alquileres
CREATE OR REPLACE FUNCTION registrar_pago_alquiler(p_texto TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_monto TEXT;
    v_nombre TEXT;
    v_cliente_id UUID;
    v_dispenser_id UUID;
    v_user_id UUID;
BEGIN
    -- Extraer numeros del texto
    v_monto := REGEXP_REPLACE(p_texto, '[^0-9]', '', 'g');
    
    -- Extraer nombre (antes de "te ")
    v_nombre := TRIM(SPLIT_PART(p_texto, 'te ', 1));
    
    IF v_monto IS NULL OR v_nombre IS NULL OR LENGTH(v_monto) < 4 THEN
        RETURN json_build_object('success', false, 'msg', 'no encontrado', 'monto', v_monto, 'nombre', v_nombre);
    END IF;
    
    SELECT c.id, c.user_id INTO v_cliente_id, v_user_id
    FROM clientes c
    WHERE LOWER(c.nombre) LIKE '%' || LOWER(v_nombre) || '%'
    LIMIT 1;
    
    IF v_cliente_id IS NULL THEN
        RETURN json_build_object('success', false, 'msg', 'cliente no existe');
    END IF;
    
    SELECT d.id INTO v_dispenser_id
    FROM dispensers d
    WHERE d.cliente_id = v_cliente_id AND d.estado = 'instalado'
    LIMIT 1;
    
    IF v_dispenser_id IS NULL THEN
        RETURN json_build_object('success', false, 'msg', 'sin dispenser');
    END IF;
    
    IF EXISTS (SELECT 1 FROM operaciones WHERE entidad_referencia = v_cliente_id AND categoria = 'Alquiler Dispenser' AND fecha >= CURRENT_DATE - INTERVAL '30 days') THEN
        RETURN json_build_object('success', false, 'msg', 'ya pagado');
    END IF;
    
    INSERT INTO operaciones (user_id, fecha, tipo, categoria, monto, concepto, metodo_pago, entidad_referencia)
    VALUES (v_user_id, NOW(), 'ingreso', 'Alquiler Dispenser', v_monto::NUMERIC, 'Alquiler', 'transferencia', v_cliente_id);
    
    RETURN json_build_object('success', true, 'msg', 'ok', 'monto', v_monto, 'cliente', v_nombre);
END;
$$;
