import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const AlquileresListModal = ({ isOpen, onClose }) => {
    const [alquileres, setAlquileres] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const fetchAlquileres = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Obtener dispensers - no filtramos por estado aquí para capturar posibles variaciones ocultas
            const { data: dbDispensersRaw, error: dispError } = await supabase
                .from('dispensers')
                .select(`*, clientes (id, nombre)`);
            
            if (dispError) {
                console.error("Error al buscar dispensers:", dispError);
                throw dispError;
            }

            // Filtramos en memoria para máxima flexibilidad de casing y espacios
            const dbDispensers = (dbDispensersRaw || []).filter(d => 
                d.estado && d.estado.toLowerCase().includes('instalado')
            );

            // 2. Definir rango del mes seleccionado
            const mesStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
            const inicioMes = `${selectedYear}-${mesStr}-01`;
            
            // Calculamos el último día del mes localmente y concatenamos
            const maxDays = new Date(selectedYear, selectedMonth, 0).getDate();
            const finMes = `${selectedYear}-${mesStr}-${maxDays < 10 ? '0'+maxDays : maxDays}`;
            
            // 3. Obtener operaciones "Alquiler Dispenser" del periodo
            let operaciones = [];
            const { data: opsData, error: opError } = await supabase
                .from('operaciones')
                .select('entidad_referencia, monto, fecha')
                .ilike('categoria', '%Alquiler Dispenser%')
                .gte('fecha', inicioMes)
                .lte('fecha', finMes);
            
            if (opError) {
                console.error("Error al buscar operaciones (Opcional):", opError);
                setError(prev => prev ? prev + " | Error Operaciones" : "Error Operaciones");
            } else {
                operaciones = opsData || [];
            }

            // 4. Obtener pedidos del periodo para cuota (bidones)
            let pedidos = [];
            const { data: pedData, error: pedError } = await supabase
                .from('pedidos')
                .select('cliente_id, detalles_pedido(cantidad, producto)')
                .ilike('estado', '%entregado%')
                .gte('fecha', inicioMes)
                .lte('fecha', finMes);
            
            if (pedError) {
                console.error("Error al buscar pedidos (Opcional):", pedError);
                setError(prev => prev ? prev + " | Error Pedidos rel" : "Error Pedidos rel");
            } else {
                pedidos = pedData || [];
            }

            // 5. Procesar datos
            const listaProcesada = (dbDispensers || []).map((disp) => {
                // RLS on clientes table might make disp.clientes null or undefined.
                const clienteId = disp.clientes ? disp.clientes.id : null;
                const clienteNombre = disp.clientes ? disp.clientes.nombre : 'Desconocido';
                
                // Buscar si pagó en ESTE periodo seleccionado
                const pagoRealizado = (operaciones || []).find(op => op.entidad_referencia === clienteId && clienteId != null);
                
                let totalBidones = 0;
                const pedidosCliente = (pedidos || []).filter(p => p.cliente_id === clienteId && clienteId != null);
                pedidosCliente.forEach(p => {
                    (p.detalles_pedido || []).forEach(d => {
                        // SAFE CHECK: Si d.producto es undefined/null
                        const prod = d.producto || '';
                        const esBidon = prod.toLowerCase().includes('bidon') || 
                                        prod.toLowerCase().includes('bidón') ||
                                        prod.toLowerCase().includes('20l');
                        if (esBidon) totalBidones += (Number(d.cantidad) || 0);
                    });
                });

                return {
                    dispenser_id: disp.id,
                    cliente_id: clienteId,
                    cliente_nombre: clienteNombre,
                    modelo: disp.modelo,
                    bidones_entregados: totalBidones,
                    pagado: !!pagoRealizado,
                    monto_pagado: pagoRealizado ? pagoRealizado.monto : 0
                };
            });

            listaProcesada.sort((a, b) => {
                if (a.pagado !== b.pagado) return a.pagado ? 1 : -1;
                return a.cliente_nombre.localeCompare(b.cliente_nombre);
            });

            setAlquileres(listaProcesada);
        } catch (error) {
            console.error("Error Crítico al cargar alquileres:", error);
            setError(error.message || "Error desconocido al conectar con la base de datos");
            setAlquileres([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchAlquileres();
    }, [isOpen, selectedMonth, selectedYear]);

    const handleCobrar = async (clienteId, clienteNombre) => {
        const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(selectedYear, selectedMonth - 1));
        const montoStr = window.prompt(`Registrar cobro de alquiler (${nombreMes} ${selectedYear}) para ${clienteNombre}:\nIngrese el monto (ej: 5000):`);
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
                    concepto: `Alquiler Dispenser - ${clienteNombre} (${nombreMes} ${selectedYear})`,
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
            {error && (
                <div style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#991b1b', 
                    padding: '1rem', 
                    borderRadius: 'var(--border-radius-md)', 
                    marginBottom: '1rem',
                    border: '1px solid #f87171',
                    fontSize: '0.875rem'
                }}>
                    <strong>⚠️ Error de Base de Datos:</strong> {error}
                    <br />
                    <small>Intenta recargar la página o contacta a soporte.</small>
                </div>
            )}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por cliente..."
                    style={{ flex: 2, minWidth: '200px', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
                    <select 
                        style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i+1} value={i+1}>
                                {new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2000, i))}
                            </option>
                        ))}
                    </select>
                    <select 
                        style={{ flex: 0.6, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ overflowX: 'auto', minHeight: '300px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Calculando cupos y cuotas...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                        No hay clientes con dispensers encontrados.
                    </div>
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
