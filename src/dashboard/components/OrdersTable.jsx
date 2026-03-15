import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const OrdersTable = () => {
    const [activeTab, setActiveTab] = useState('Pendientes');
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        cargarPedidos();
    }, [activeTab]);

    const cargarPedidos = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    clientes (
                        nombre,
                        telefono,
                        direccion
                    ),
                    detalles_pedido (
                        producto,
                        cantidad
                    )
                `)
                .eq('estado', activeTab === 'Pendientes' ? 'Pendiente' : (activeTab === 'Entregados' ? 'Entregado' : 'Anulado'))
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error cargando pedidos:", error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="orders-area">
            <div className="orders-header">Pedidos</div>
            <div className="orders-tabs">
                <div className={`order-tab ${activeTab === 'Entregados' ? 'active' : ''}`} onClick={() => setActiveTab('Entregados')}>Entregados</div>
                <div className={`order-tab ${activeTab === 'Pendientes' ? 'active' : ''}`} onClick={() => setActiveTab('Pendientes')}>Pendientes</div>
                <div className={`order-tab ${activeTab === 'Anulados' ? 'active' : ''}`} onClick={() => setActiveTab('Anulados')}>Anulados</div>
            </div>
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>Cod</th>
                        <th>Actualizado</th>
                        <th>Creado</th>
                        <th>Origen</th>
                        <th>Responsable</th>
                        <th>Cliente</th>
                        <th>Comprobante</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                        <th>Referencia</th>
                        <th>Productos</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>Cargando pedidos...</td></tr>
                    ) : orders.length > 0 ? orders.map(order => (
                        <tr key={order.id}>
                            <td style={{ fontSize: '0.7rem' }}>{order.id.split('-')[0]}</td>
                            <td style={{ fontSize: '0.75rem' }}>{new Date(order.created_at).toLocaleString()}</td>
                            <td style={{ fontSize: '0.75rem' }}>{new Date(order.fecha).toLocaleDateString()}</td>
                            <td><span style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Mostrador</span></td>
                            <td style={{ fontSize: '0.75rem' }}>Administrador</td>
                            <td>{order.clientes?.nombre || 'Consumidor Final'}</td>
                            <td>${order.total}</td>
                            <td>{order.clientes?.telefono || '-'}</td>
                            <td style={{ fontSize: '0.7rem', maxWidth: '150px' }}>{order.clientes?.direccion || '-'}</td>
                            <td style={{ fontSize: '0.7rem' }}>{order.notas}</td>
                            <td>
                                {order.detalles_pedido?.map((d, i) => (
                                    <div key={i} style={{ fontSize: '0.7rem' }}>{d.cantidad}x {d.producto}</div>
                                ))}
                            </td>
                        </tr>
                    )) : <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>No hay pedidos {activeTab.toLowerCase()}</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export default OrdersTable;
