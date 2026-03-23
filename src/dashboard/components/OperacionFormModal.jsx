import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const OperacionFormModal = ({ isOpen, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'gasto',
        categoria: '',
        monto: '',
        metodoPago: 'efectivo',
        entidadReferencia: '',
        concepto: ''
    });

    // Reiniciar el formulario cada vez que se abre
    useEffect(() => {
        if (isOpen) {
            setFormData({
                fecha: new Date().toISOString().split('T')[0],
                tipo: 'gasto',
                categoria: '',
                monto: '',
                metodoPago: 'efectivo',
                entidadReferencia: '',
                concepto: ''
            });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Obtener el usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No se pudo obtener el usuario autenticado.");

            // Insertar la operación en Supabase
            const { error } = await supabase
                .from('operaciones')
                .insert([{
                    user_id: user.id,
                    fecha: formData.fecha,
                    tipo: formData.tipo,
                    categoria: formData.categoria || 'Otros',
                    monto: Number(formData.monto),
                    metodo_pago: formData.metodoPago,
                    entidad_referencia: formData.entidadReferencia,
                    concepto: formData.concepto
                }]);

            if (error) throw error;

            alert('Operación registrada con éxito.');
            onClose();
        } catch (error) {
            console.error('Error al guardar operación:', error);
            alert('Error al registrar la operación: ' + error.message);
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
        <Modal isOpen={isOpen} onClose={onClose} title="💵 Registrar Nueva Operación">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Tipo de Operación *</label>
                        <select required style={{ ...inputStyle, marginBottom: 0 }} name="tipo" value={formData.tipo} onChange={handleChange}>
                            <option value="gasto">Gasto / Salida (-)</option>
                            <option value="ingreso">Ingreso (+)</option>
                            <option value="ajuste">Ajuste de Saldo</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Monto *</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-gray)' }}>$</span>
                            <input required style={{ ...inputStyle, marginBottom: 0, paddingLeft: '1.5rem' }} type="number" min="0" step="0.01" name="monto" value={formData.monto} onChange={handleChange} placeholder="0.00" />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Fecha *</label>
                        <input required style={inputStyle} type="date" name="fecha" value={formData.fecha} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Categoría</label>
                        <select style={inputStyle} name="categoria" value={formData.categoria} onChange={handleChange}>
                            <option value="">Seleccionar categoría...</option>
                            {formData.tipo === 'gasto' && (
                                <>
                                    <option value="combustible">Combustible</option>
                                    <option value="mantenimiento">Mantenimiento Vehículos</option>
                                    <option value="recarga_agua">Recarga Agua</option>
                                    <option value="bidones">Bidones / Envases</option>
                                    <option value="sueldos">Sueldos / Adelantos</option>
                                    <option value="impuestos">Impuestos / Servicios</option>
                                </>
                            )}
                            {formData.tipo === 'ingreso' && (
                                <>
                                    <option value="cobranza">Cobro de Cuenta Corriente</option>
                                    <option value="venta_mostrador">Venta en Mostrador</option>
                                    <option value="otros_ingresos">Otros Ingresos</option>
                                </>
                            )}
                            {formData.tipo === 'ajuste' && (
                                <option value="ajuste_caja">Ajuste de Caja</option>
                            )}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Método de Pago *</label>
                        <select required style={inputStyle} name="metodoPago" value={formData.metodoPago} onChange={handleChange}>
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia Bancaria / App</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Asociar a (Cliente/Proveedor)</label>
                        <input style={inputStyle} type="text" name="entidadReferencia" value={formData.entidadReferencia} onChange={handleChange} placeholder="Opcional..." />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Concepto / Descripción *</label>
                    <textarea required style={{ ...inputStyle, resize: 'none' }} rows="2" name="concepto" value={formData.concepto} onChange={handleChange} placeholder="Ej. Pago de factura de luz local..."></textarea>
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

                    <button type="submit" disabled={isSubmitting} style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: isSubmitting ? '#94a3b8' : (formData.tipo === 'gasto' ? '#ef4444' : 'var(--primary-blue)'),
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                    }}>
                        {isSubmitting ? 'Procesando...' : `Registrar ${formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1)}`}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default OperacionFormModal;
