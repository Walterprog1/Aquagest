import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const MigrationTool = ({ user }) => {
    const [hasData, setHasData] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [stats, setStats] = useState({ clientes: 0, vehiculos: 0, zonas: 0, pedidos: 0, usuarios: 0 });

    useEffect(() => {
        const clientesStr = localStorage.getItem('aquagest_clientes');
        const vehiculosStr = localStorage.getItem('aquagest_vehiculos');
        const zonasStr = localStorage.getItem('aquagest_zonas');
        const pedidosStr = localStorage.getItem('aquagest_pedidos');
        const usuariosStr = localStorage.getItem('aquagest_usuarios');

        const clientes = JSON.parse(clientesStr || '[]');
        const vehiculos = JSON.parse(vehiculosStr || '[]');
        const zonas = JSON.parse(zonasStr || '[]');
        const pedidos = JSON.parse(pedidosStr || '[]');
        const usuarios = JSON.parse(usuariosStr || '[]');

        if (clientes.length > 0 || vehiculos.length > 0 || zonas.length > 0 || pedidos.length > 0 || usuarios.length > 0) {
            setHasData(true);
            setStats({
                clientes: clientes.length,
                vehiculos: vehiculos.length,
                zonas: zonas.length,
                pedidos: pedidos.length,
                usuarios: usuarios.length
            });
        }
    }, []);

    const handleMigrate = async () => {
        if (!window.confirm('¿Deseas subir tus datos locales a la nube ahora? Los datos aparecerán en todos tus dispositivos.')) return;
        
        setIsMigrating(true);
        try {
            // 1. Clientes
            const clientes = JSON.parse(localStorage.getItem('aquagest_clientes') || '[]');
            if (clientes.length > 0) {
                const clientesToInsert = clientes.map(c => ({
                    nombre: c.nombre,
                    direccion: c.direccion,
                    localidad: c.localidad,
                    telefono: c.telefono,
                    whatsapp: c.whatsapp,
                    tipo: c.tipo,
                    email: c.email,
                    precio_especial: parseFloat(c.precioEspecialBidon20L) || 0,
                    notas: c.notas,
                    lat: c.lat ? parseFloat(c.lat) : null,
                    lng: c.lng ? parseFloat(c.lng) : null,
                    user_id: user.id
                }));
                const { error } = await supabase.from('clientes').insert(clientesToInsert);
                if (error) throw error;
            }

            // 2. Vehículos
            const vehiculos = JSON.parse(localStorage.getItem('aquagest_vehiculos') || '[]');
            if (vehiculos.length > 0) {
                const vehiculosToInsert = vehiculos.map(v => ({
                    marca: v.marca,
                    modelo: v.modelo,
                    patente: v.patente,
                    capacidad: parseInt(v.capacidadCarga) || 0,
                    estado: v.estado,
                    vencimiento_seguro: v.vencimientoSeguro || null,
                    notas: v.notas || '',
                    user_id: user.id
                }));
                const { error } = await supabase.from('vehiculos').insert(vehiculosToInsert);
                if (error) throw error;
            }

            // 3. Zonas
            const zonas = JSON.parse(localStorage.getItem('aquagest_zonas') || '[]');
            if (zonas.length > 0) {
                const zonasToInsert = zonas.map(z => ({
                    nombre: z.nombre,
                    descripcion: z.descripcion + (z.codigoPostal ? ` (CP: ${z.codigoPostal})` : '') + 
                               (z.diasVisita?.length > 0 ? ` [Días: ${z.diasVisita.join(', ')}]` : ''),
                    user_id: user.id
                }));
                const { error } = await supabase.from('zonas_reparto').insert(zonasToInsert);
                if (error) throw error;
            }

            // 4. Usuarios (Perfiles)
            const usuarios = JSON.parse(localStorage.getItem('aquagest_usuarios') || '[]');
            if (usuarios.length > 0) {
                const perfilesToInsert = usuarios.map(u => ({
                    nombre: u.nombre,
                    apellido: u.apellido,
                    dni: u.dni,
                    email: u.email,
                    telefono: u.telefono,
                    rol: u.rol,
                    estado: u.estado
                    // password no se migra a perfiles, se gestionaría vía Auth si es necesario
                }));
                const { error } = await supabase.from('perfiles').insert(perfilesToInsert);
                if (error) throw error;
            }

            // 5. Pedidos
            const pedidos = JSON.parse(localStorage.getItem('aquagest_pedidos') || '[]');
            if (pedidos.length > 0) {
                for (const p of pedidos) {
                    let clienteId = null;
                    if (p.client) {
                        const { data: dbClient } = await supabase
                            .from('clientes')
                            .select('id')
                            .ilike('nombre', p.client)
                            .maybeSingle();
                        if (dbClient) clienteId = dbClient.id;
                    }

                    const { data: newPedido, error: ep } = await supabase
                        .from('pedidos')
                        .insert([{
                            cliente_id: clienteId,
                            fecha: p.created ? new Date(p.created.split(',')[0].split('/').reverse().join('-')).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            total: p.total || 0,
                            medio_pago: p.medioPago || 'efectivo',
                            estado: p.status || 'Entregado',
                            notas: (p.notes || '') + (clienteId ? '' : ` [Cliente original: ${p.client}]`),
                            user_id: user.id
                        }])
                        .select()
                        .single();
                    
                    if (ep) throw ep;

                    if (p.items && p.items.length > 0) {
                        const detalles = p.items.map(item => ({
                            pedido_id: newPedido.id,
                            producto: item.nombre || 'Bidón 20L',
                            cantidad: item.cantidad || 0,
                            precio_unitario: item.precio || 0
                        }));
                        const { error: ed } = await supabase.from('detalles_pedido').insert(detalles);
                        if (ed) throw ed;
                    }
                }
            }

            // Limpiar localStorage
            localStorage.removeItem('aquagest_clientes');
            localStorage.removeItem('aquagest_vehiculos');
            localStorage.removeItem('aquagest_zonas');
            localStorage.removeItem('aquagest_pedidos');
            localStorage.removeItem('aquagest_usuarios');
            localStorage.removeItem('aquagest_stock');

            alert('¡Migración exitosa! Todos tus datos están en la nube.');
            window.location.reload();
        } catch (error) {
            console.error("Error en migración:", error);
            alert("Ocurrió un error al migrar: " + error.message);
        } finally {
            setIsMigrating(false);
        }
    };

    if (!hasData) return null;

    return (
        <div style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚚</span>
                <div>
                    <h4 style={{ margin: 0, color: '#9a3412', fontSize: '1rem' }}>¡Deberías migrar tus datos!</h4>
                    <p style={{ margin: '4px 0 0', color: '#c2410c', fontSize: '0.875rem' }}>
                        Tienes datos guardados en este navegador ({stats.usuarios} usuarios, {stats.clientes} clientes, etc.). 
                        Presiona el botón para subirlos a la nube y que aparezcan en todos tus dispositivos.
                    </p>
                </div>
            </div>
            <button 
                onClick={handleMigrate}
                disabled={isMigrating}
                style={{
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: isMigrating ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                }}
            >
                {isMigrating ? 'Subiendo...' : '🚀 Subir a la Nube'}
            </button>
        </div>
    );
};

export default MigrationTool;
