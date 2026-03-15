-- INSTRUCCIONES DE LIMPIEZA (Ejecutar para resetear las tablas si hay errores de esquema)
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS vehiculos CASCADE;
DROP TABLE IF EXISTS zonas_reparto CASCADE;

-- TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nombre TEXT NOT NULL,
    direccion TEXT NOT NULL,
    localidad TEXT NOT NULL,
    telefono TEXT,
    whatsapp TEXT NOT NULL,
    tipo TEXT DEFAULT 'residencial',
    email TEXT,
    precio_especial NUMERIC DEFAULT 0,
    notas TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);

-- TABLA DE VEHICULOS
CREATE TABLE IF NOT EXISTS vehiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    patente TEXT NOT NULL,
    capacidad INTEGER,
    estado TEXT DEFAULT 'activo',
    vencimiento_seguro DATE,
    notas TEXT
);

-- TABLA DE ZONAS DE REPARTO
CREATE TABLE IF NOT EXISTS zonas_reparto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    color TEXT DEFAULT '#3b82f6'
);

-- TABLA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    total NUMERIC DEFAULT 0,
    medio_pago TEXT DEFAULT 'efectivo',
    estado TEXT DEFAULT 'Pendiente',
    notas TEXT
);

-- TABLA DE DETALLES DE PEDIDO
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
    producto TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC NOT NULL
);

-- TABLA DE MOVIMIENTOS DE STOCK
CREATE TABLE IF NOT EXISTS movimientos_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo_envase TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    tipo_movimiento TEXT NOT NULL, -- 'ingreso' o 'egreso'
    motivo TEXT,
    notas TEXT
);

-- POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;

-- Reglas para Pedidos
CREATE POLICY "Usuarios pueden ver sus propios pedidos" ON pedidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar sus propios pedidos" ON pedidos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden editar sus propios pedidos" ON pedidos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden borrar sus propios pedidos" ON pedidos FOR DELETE USING (auth.uid() = user_id);

-- Reglas para Detalles (Usamos el user_id del pedido relacionado)
CREATE POLICY "Usuarios pueden ver detalles de sus pedidos" ON detalles_pedido FOR SELECT 
USING (EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = detalles_pedido.pedido_id AND pedidos.user_id = auth.uid()));

CREATE POLICY "Usuarios pueden insertar detalles en sus pedidos" ON detalles_pedido FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = detalles_pedido.pedido_id AND pedidos.user_id = auth.uid()));

-- Reglas para Stock
CREATE POLICY "Usuarios pueden ver sus movimientos de stock" ON movimientos_stock FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar sus movimientos de stock" ON movimientos_stock FOR INSERT WITH CHECK (auth.uid() = user_id);
