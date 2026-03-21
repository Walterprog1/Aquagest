import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const StockFormModal = ({ isOpen, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipoEnvase: 'bidon_20l',
        cantidad: 0,
        movimiento: 'ingreso',
        motivo: '',
        notas: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const { error } = await supabase
                .from('movimientos_stock')
                .insert([{
                    tipo_envase: formData.tipoEnvase,
                    cantidad: parseInt(formData.cantidad),
                    tipo_movimiento: formData.movimiento,
                    motivo: formData.motivo,
                    notas: formData.notas,
                    user_id: user.id,
                    created_at: new Date(formData.fecha).toISOString()
                }]);

            if (error) throw error;

            alert('Movimiento de stock registrado con éxito en la nube.');
            onClose();
        } catch (error) {
            console.error("Error al registrar stock:", error);
            alert("No se pudo registrar el movimiento: " + error.message);
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
        <Modal isOpen={isOpen} onClose={onClose} title="📈 Registrar Movimiento de Stock">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Fecha *</label>
                        <input required style={inputStyle} type="date" name="fecha" value={formData.fecha} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Tipo de Envase *</label>
                        <select required style={inputStyle} name="tipoEnvase" value={formData.tipoEnvase} onChange={handleChange}>
                            <option value="bidon_20l">Bidón 20L</option>
                            <option value="bidon_12l">Bidón 12L</option>
                            <option value="sifon_1_5l">Sifón 1.5L</option>
                            <option value="dispenser_fc">Dispenser Frío/Calor</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Tipo de Movimiento *</label>
                        <select required style={{ ...inputStyle, marginBottom: 0 }} name="movimiento" value={formData.movimiento} onChange={handleChange}>
                            <option value="ingreso">Ingreso (+)</option>
                            <option value="egreso">Egreso/Baja (-)</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Cantidad *</label>
                        <input required style={{ ...inputStyle, marginBottom: 0 }} type="number" min="1" name="cantidad" value={formData.cantidad} onChange={handleChange} />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Motivo (Obligatorio para bajas) *</label>
                    <select required style={inputStyle} name="motivo" value={formData.motivo} onChange={handleChange}>
                        <option value="">Seleccionar motivo...</option>
                        <option value="compra_nueva">Compra de envases nuevos (Ingreso)</option>
                        <option value="devolucion_proveedor">Devolución de proveedor (Ingreso)</option>
                        <option value="rotura">Rotura / Dañado (Baja)</option>
                        <option value="perdida">Pérdida (Baja)</option>
                        <option value="descarte">Descarte por antigüedad (Baja)</option>
                        <option value="ajuste">Ajuste de inventario</option>
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Notas adicionales</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="2" name="notas" value={formData.notas} onChange={handleChange} placeholder="Detalles sobre la rotura, número de remito de compra, etc."></textarea>
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
                        backgroundColor: formData.movimiento === 'ingreso' ? '#10b981' : '#ef4444',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>
                        {formData.movimiento === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Baja'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default StockFormModal;
