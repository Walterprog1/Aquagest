import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const PedidoFormModal = ({ isOpen, onClose }) => {
    const [clientesGuardados, setClientesGuardados] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const guardados = JSON.parse(localStorage.getItem('aquagest_clientes') || '[]');
            setClientesGuardados(guardados);
        }
    }, [isOpen]);

    const [formData, setFormData] = useState({
        cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        envasesEntregados: 0,
        envasesRecibidos: 0,
        precioUnitario: 2500,
        medioPago: 'efectivo',
        notas: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Si cambia el cliente, intentamos recuperar su precio especial si existe
        if (name === 'cliente' && value) {
            const clienteSeleccionado = clientesGuardados.find(c => c.id === value);
            if (clienteSeleccionado && clienteSeleccionado.precioEspecialBidon20L) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    precioUnitario: parseFloat(clienteSeleccionado.precioEspecialBidon20L)
                }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calcularTotal = () => {
        return formData.envasesEntregados * formData.precioUnitario;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const clienteData = clientesGuardados.find(c => c.id === formData.cliente);

        const nuevoPedido = {
            id: `PED-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
            updated: new Date().toLocaleString(),
            created: new Date().toLocaleString(),
            origin: "Mostrador", // Por defecto si se crea desde este modal
            responsible: "Administrador", // Temporal hasta tener login
            client: clienteData ? `${clienteData.nombre}` : 'Consumidor Final',
            phone: clienteData ? clienteData.telefono : '-',
            address: clienteData ? clienteData.direccion : 'Retiro en local',
            status: "Pendiente",
            items: [
                {
                    nombre: "Bidón 20L",
                    cantidad: formData.envasesEntregados,
                    precio: formData.precioUnitario
                }
            ],
            total: calcularTotal(),
            medioPago: formData.medioPago,
            rawFormData: formData // Guardamos todo por las dudas
        };

        const pedidosActuales = JSON.parse(localStorage.getItem('aquagest_pedidos') || '[]');
        pedidosActuales.push(nuevoPedido);
        localStorage.setItem('aquagest_pedidos', JSON.stringify(pedidosActuales));

        alert('¡Venta/Pedido registrado con éxito!');

        setFormData({
            cliente: '',
            fecha: new Date().toISOString().split('T')[0],
            envasesEntregados: 0,
            envasesRecibidos: 0,
            precioUnitario: 2500,
            medioPago: 'efectivo',
            notas: ''
        });

        onClose();
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        marginBottom: '1rem',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        fontFamily: 'inherit',
        backgroundColor: 'white'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        fontSize: '0.875rem'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🛒 Registrar Nuevo Pedido / Venta">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Cliente *</label>
                        <select required style={inputStyle} name="cliente" value={formData.cliente} onChange={handleChange}>
                            <option value="">Buscar o seleccionar cliente...</option>
                            {clientesGuardados.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nombre} {cliente.tipo === 'comercial' ? '(Comercial)' : ''}
                                </option>
                            ))}
                            {clientesGuardados.length === 0 && (
                                <option value="" disabled>No hay clientes guardados aún</option>
                            )}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Fecha *</label>
                        <input required style={inputStyle} type="date" name="fecha" value={formData.fecha} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>💧 Envases Entregados (Llenos)</label>
                        <input required style={inputStyle} type="number" min="0" name="envasesEntregados" value={formData.envasesEntregados} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>🔄 Envases Recibidos (Vacíos)</label>
                        <input required style={inputStyle} type="number" min="0" name="envasesRecibidos" value={formData.envasesRecibidos} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>💲 Precio Unitario</label>
                        <input required style={inputStyle} type="number" min="0" step="100" name="precioUnitario" value={formData.precioUnitario} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Medio de Pago *</label>
                        <select required style={{ ...inputStyle, marginBottom: 0 }} name="medioPago" value={formData.medioPago} onChange={handleChange}>
                            <option value="efectivo">Efectivo 💵</option>
                            <option value="transferencia">Transferencia 📱</option>
                            <option value="fiado">Pendiente de Pago / Fiado 📉</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', paddingRight: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>Total a cobrar:</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                            ${calcularTotal()}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Notas adicionales</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="2" name="notas" value={formData.notas} onChange={handleChange} placeholder="Ej. El cliente pagó con billete de $10.000..."></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={onClose} style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>Cancelar</button>

                    <button type="submit" style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>Registrar Venta</button>
                </div>
            </form>
        </Modal>
    );
};

export default PedidoFormModal;
