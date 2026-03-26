import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const AlquileresListModal = ({ isOpen, onClose }) => {
    const [alquileres, setAlquileres] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAlquileres = async () => {
        setIsLoading(true);
        try {
            // 1. Obtener dispensers instalados
            const { data: dispensers, error: dispError } = await supabase
                .from('dispensers')
                .select('*, clientes (id, nombre)')
                .eq('estado', 'instalado');
            if (dispError) throw dispError;

            // 2. Obtener operaciones "Alquiler Dispenser" del mes actual
            const mesActual = new Date().toISOString().substring(0, 7); // YYYY-MM
            const inicioMes = mesActual + '-01';
            
            const { data: operaciones, error: opError } = await supabase
                .from('operaciones')
                .select('entidad_referencia, monto')
                .eq('categoria', 'Alquiler Dispenser')
                .gte('fecha', inicioMes);
            if (opError) throw opError;

            // 3. Obtener pedidos del mes para contar bidones
            const { data: pedidos, error: pedError } = await supabase
                .from('pedidos')
                .select('cliente_id, cantidad, producto_id, productos(categoria)')
                .gte('fecha', inicioMes);
            if (pedError) throw pedError;

            // 4. Procesar y combinar datos
            const listaProcesada = dispensers.map((disp) => {
                const clienteId = disp.clientes?.id;
                
                // Buscar si pagó
                const pagoRealizado = operaciones.find(op => op.entidad_referencia === clienteId);
                
                // Contar bidones
                const pedidosCliente = pedidos.filter(p => p.cliente_id === clienteId && p.productos?.categoria?.toLowerCase().includes('bidon'));
                const totalBidones = pedidosCliente.reduce((sum, p) => sum + p.cantidad, 0);

                return {
                    dispenser_id: disp.id,
                    cliente_id: clienteId,
                    cliente_nombre: disp.clientes?.nombre || 'Desconocido',
                    modelo: disp.modelo,
                    bidones_entregados: totalBidones,
                    pagado: !!pagoRealizado,
                    monto_pagado: pagoRealizado ? pagoRealizado.monto : 0
                };
            });

            // Ordenar: primero los pendientes, luego por nombre
            listaProcesada.sort((a, b) => {
                if (a.pagado !== b.pagado) return a.pagado ? 1 : -1;
                return a.cliente_nombre.localeCompare(b.cliente_nombre);
            });

            setAlquileres(listaProcesada);
        } catch (error) {
            console.error("Error al cargar alquileres:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchAlquileres();
    }, [isOpen]);

    const handleCobrar = async (clienteId, clienteNombre) => {
        const montoStr = window.prompt(`Registrar cobro de alquiler para ${clienteNombre}:\nIngrese el monto (ej: 5000):`);
        if (!montoStr) return;
        
        const monto = parseFloat(montoStr);
        if (isNaN(monto) || monto <= 0) {
            alert('Monto inválido.');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const fechaValida = new Date().toLocaleDateString('en-CA');

            const { error } = await supabase
                .from('operaciones')
                .insert([{
                    user_id: user.id,
                    fecha: fechaValida,
                    tipo: 'ingreso',
                    categoria: 'Alquiler Dispenser',
                    monto: monto,
                    concepto: `Alquiler Dispenser - ${clienteNombre}`,
                    metodo_pago: 'efectivo',
                    entidad_referencia: clienteId
                }]);
            
            if (error) throw error;
            
            fetchAlquileres(); // Recargar
        } catch (error) {
            console.error("Error al registrar cobro:", error);
            alert("Error: " + error.message);
        }
    };

    const filtered = alquileres.filter(a => a.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🏢 Control Mensual de Alquileres">
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por cliente..."
                    style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ overflowX: 'auto', minHeight: '300px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Calculando cupos y cuotas...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>No hay clientes con dispensers encontrados.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead style={{ backgroundColor: 'var(--background-gray)', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '0.75rem' }}>Cliente</th>
                                <th style={{ padding: '0.75rem' }}>Dispenser</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Cupo (Mes Actual)</th>
                                <th style={{ padding: '0.75rem' }}>Estado Cuota</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => {
                                const cupoExcedido = a.bidones_entregados > 3;
                                return (
                                <tr key={a.dispenser_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{a.cliente_nombre}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-gray)' }}>{a.modelo}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ 
                                            display: 'inline-block', 
                                            padding: '4px 8px', 
                                            borderRadius: '4px',
                                            backgroundColor: cupoExcedido ? '#fee2e2' : '#dcfce7',
                                            color: cupoExcedido ? '#991b1b' : '#166534',
                                            fontWeight: '600'
                                        }}>
                                            {a.bidones_entregados} / 3
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {a.pagado ? (
                                            <span style={{ color: '#10b981', fontWeight: '600' }}>✅ Pagado (${a.monto_pagado})</span>
                                        ) : (
                                            <span style={{ color: '#ef4444', fontWeight: '600' }}>❌ Pendiente</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        {!a.pagado && (
                                            <button 
                                                onClick={() => handleCobrar(a.cliente_id, a.cliente_nombre)}
                                                style={{ padding: '4px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                                            >
                                                Registrar Pago
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
            </div>
        </Modal>
    );
};

export default AlquileresListModal;
