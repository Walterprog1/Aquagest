import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';
import { createPaymentLink } from '../../lib/naranjaX';

const PedidoFormModal = ({ isOpen, onClose }) => {
    const [clientesGuardados, setClientesGuardados] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            cargarClientes();
        }
    }, [isOpen]);

    const cargarClientes = async () => {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (!error) {
            setClientesGuardados(data || []);
        }
    };

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

        if (name === 'cliente' && value) {
            const clienteSeleccionado = clientesGuardados.find(c => c.id === value);
            if (clienteSeleccionado && clienteSeleccionado.precio_especial) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    precioUnitario: parseFloat(clienteSeleccionado.precio_especial)
                }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calcularTotal = () => {
        return formData.envasesEntregados * formData.precioUnitario;
    };

    const [paymentUrl, setPaymentUrl] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setPaymentUrl(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // 1. Insertar el Pedido
            const { data: pedido, error: errorPedido } = await supabase
                .from('pedidos')
                .insert([{
                    cliente_id: formData.cliente || null,
                    fecha: formData.fecha,
                    total: calcularTotal(),
                    medio_pago: formData.medioPago,
                    estado: 'Entregado',
                    pago_estado: (formData.medioPago === 'transferencia' || formData.medioPago === 'fiado') ? 'pendiente' : 'pagado',
                    notas: formData.notas,
                    user_id: user.id
                }])
                .select()
                .single();

            if (errorPedido) throw errorPedido;

            // 2. Insertar el detalle
            const { error: errorDetalle } = await supabase
                .from('detalles_pedido')
                .insert([{
                    pedido_id: pedido.id,
                    producto: 'Bidón 20L',
                    cantidad: formData.envasesEntregados,
                    precio_unitario: formData.precioUnitario
                }]);

            if (errorDetalle) throw errorDetalle;

            // 3. Generar Link si es transferencia automática
            if (formData.medioPago === 'transferencia') {
                try {
                    const url = await createPaymentLink({
                        id: pedido.id,
                        total: calcularTotal()
                    });
                    setPaymentUrl(url);
                    alert('Pedido registrado. Generando link de Nave para conciliación automática...');
                } catch (pe) {
                    console.error("Fallo Nave:", pe);
                    alert("Venta guardada, pero no pudimos generar el link de Nave. Deberás verificar el pago manualmente.");
                }
            } else {
                alert('¡Venta registrada con éxito!');
                onClose();
            }

            // No reseteamos si hay link para que el repartidor lo vea
            if (formData.medioPago !== 'transferencia') {
                setFormData({
                    cliente: '',
                    fecha: new Date().toISOString().split('T')[0],
                    envasesEntregados: 0,
                    envasesRecibidos: 0,
                    precioUnitario: 2500,
                    medioPago: 'efectivo',
                    notas: ''
                });
            }

        } catch (error) {
            console.error("Error al registrar pedido:", error);
            alert("No se pudo registrar la venta: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
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

                {paymentUrl && (
                    <div style={{ 
                        marginTop: '1.5rem', 
                        padding: '1rem', 
                        backgroundColor: '#fff7ed', 
                        border: '1px solid #ffedd5', 
                        borderRadius: 'var(--border-radius-md)',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontWeight: '600', color: '#c2410c', marginBottom: '0.5rem' }}>¡Link de Pago Generado!</p>
                        <a href={paymentUrl} target="_blank" rel="noreferrer" style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#f97316',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem'
                        }}>PAGAR CON NAVE</a>
                        <p style={{ fontSize: '0.75rem', color: '#9a3412', marginBottom: '0.5rem' }}>El cliente debe elegir 'Transferencia' dentro de Nave para que sea automático.</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold', border: '1px dashed #fdba74', padding: '4px', display: 'inline-block' }}>ALIAS: surgentesnogoli</p>
                    </div>
                )}

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
