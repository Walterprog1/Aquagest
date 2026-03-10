import React, { useState } from 'react';

const OrdersTable = () => {
    const [activeTab, setActiveTab] = useState('Pendientes');
    const [orders, setOrders] = useState([]);

    React.useEffect(() => {
        const cargarPedidos = () => {
            const guardados = JSON.parse(localStorage.getItem('aquagest_pedidos') || '[]');
            setOrders(guardados);
        };

        cargarPedidos();

        // Intervalo para capturar cambios de los modales sin Redux/Context complejo
        const interval = setInterval(cargarPedidos, 2000);
        return () => clearInterval(interval);
    }, []);

    const filteredOrders = orders.filter(order => {
        const status = order.status || 'Pendiente';
        if (activeTab === 'Pendientes') return status === 'Pendiente';
        if (activeTab === 'Entregados') return status === 'Entregado';
        if (activeTab === 'Anulados') return status === 'Anulado';
        return false;
    });

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
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td style={{ fontSize: '0.75rem' }}>{order.updated}</td>
                            <td style={{ fontSize: '0.75rem' }}>{order.created}</td>
                            <td><span style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{order.origin}</span></td>
                            <td style={{ fontSize: '0.75rem' }}>{order.responsible}</td>
                            <td>{order.client}</td>
                            <td></td>
                            <td>{order.phone}</td>
                            <td style={{ fontSize: '0.7rem', maxWidth: '150px' }}>{order.address}</td>
                            <td></td>
                            <td><input type="checkbox" /></td>
                        </tr>
                    )) : <tr><td colSpan="11" style={{ textAlign: 'center' }}>No hay pedidos {activeTab.toLowerCase()}</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export default OrdersTable;
