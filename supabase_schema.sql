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

-- POLÍTICAS DE SEGURIDAD (RLS) - Permite que los usuarios solo vean SUS propios datos
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_reparto ENABLE ROW LEVEL SECURITY;

-- Reglas para Clientes
CREATE POLICY "Usuarios pueden ver sus propios clientes" ON clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar sus propios clientes" ON clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden editar sus propios clientes" ON clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden borrar sus propios clientes" ON clientes FOR DELETE USING (auth.uid() = user_id);

-- Reglas para Vehiculos
CREATE POLICY "Usuarios pueden ver sus vehiculos" ON vehiculos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar sus vehiculos" ON vehiculos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden editar sus vehiculos" ON vehiculos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden borrar sus vehiculos" ON vehiculos FOR DELETE USING (auth.uid() = user_id);

-- Reglas para Zonas
CREATE POLICY "Usuarios pueden ver sus zonas" ON zonas_reparto FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar sus zonas" ON zonas_reparto FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden editar sus zonas" ON zonas_reparto FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden borrar sus zonas" ON zonas_reparto FOR DELETE USING (auth.uid() = user_id);
