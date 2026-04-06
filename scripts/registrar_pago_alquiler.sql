-- Funcion para detectar y registrar pagos de alquiler de dispenser
CREATE OR REPLACE FUNCTION registrar_pago_alquiler(p_titulo TEXT, p_cuerpo TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_monto NUMERIC;
    v_nombre TEXT;
    v_cliente_id UUID;
    v_dispenser_id UUID;
    v_user_id UUID;
    v_resultado JSON;
BEGIN
    -- Extraer monto del titulo
    v_monto := NULL;
    IF p_titulo ~ '[0-9]' THEN
        v_monto := NULLIF(REGEXP_REPLACE(p_titulo, '[^0-9,]', '', 'g'), '')::NUMERIC;
    END IF;
    
    -- Extraer nombre del cliente del cuerpo
    v_nombre := NULL;
    IF p_cuerpo ~ 'te envio' THEN
        v_nombre := TRIM(SPLIT_PART(p_cuerpo, 'te envio', 1));
    ELSIF p_cuerpo ~ 'te transfirio' THEN
        v_nombre := TRIM(SPLIT_PART(p_cuerpo, 'te transfirio', 1));
    END IF;
    
    -- Si no hay monto o nombre, salir
    IF v_monto IS NULL OR v_nombre IS NULL OR LENGTH(TRIM(v_nombre)) < 2 THEN
        RETURN json_build_object('success', false, 'message', 'No se pudo extraer monto o nombre');
    END IF;
    
    -- Buscar cliente por nombre
    SELECT c.id, c.user_id INTO v_cliente_id, v_user_id
    FROM clientes c
    WHERE LOWER(c.nombre) LIKE LOWER('%' || v_nombre || '%')
    LIMIT 1;
    
    IF v_cliente_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Cliente no encontrado');
    END IF;
    
    -- Verificar si tiene dispenser instalado
    SELECT d.id INTO v_dispenser_id
    FROM dispensers d
    WHERE d.cliente_id = v_cliente_id AND d.estado = 'instalado'
    LIMIT 1;
    
    IF v_dispenser_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Cliente sin dispenser instalado');
    END IF;
    
    -- Verificar si ya hay un pago registrado este mes
    IF EXISTS (
        SELECT 1 FROM operaciones 
        WHERE entidad_referencia = v_cliente_id 
        AND categoria = 'Alquiler Dispenser'
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM NOW())
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM NOW())
    ) THEN
        RETURN json_build_object('success', false, 'message', 'Alquiler ya pagado este mes');
    END IF;
    
    -- Registrar el pago
    INSERT INTO operaciones (user_id, fecha, tipo, categoria, monto, concepto, metodo_pago, entidad_referencia)
    VALUES (v_user_id, NOW(), 'ingreso', 'Alquiler Dispenser', v_monto, 'Alquiler Dispenser - Pago automatico', 'transferencia', v_cliente_id);
    
    RETURN json_build_object('success', true, 'message', 'Pago registrado', 'monto', v_monto, 'cliente', v_nombre);
END;
$$;
