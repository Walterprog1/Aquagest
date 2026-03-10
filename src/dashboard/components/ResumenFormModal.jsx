import React, { useState } from 'react';
import Modal from './Modal';

const ResumenFormModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipoResumen: 'cierre_caja',
        responsable: '',
        efectivoCaja: '',
        gastosDia: '',
        observaciones: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Guardando resumen:', formData);
        alert('Resumen registrado con éxito (Simulación)');
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
        <Modal isOpen={isOpen} onClose={onClose} title="📊 Agregar Resumen / Cierre">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Fecha *</label>
                        <input required style={inputStyle} type="date" name="fecha" value={formData.fecha} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Tipo de Resumen *</label>
                        <select required style={inputStyle} name="tipoResumen" value={formData.tipoResumen} onChange={handleChange}>
                            <option value="cierre_caja">Cierre de Caja Diario</option>
                            <option value="cierre_semana">Cierre Semanal</option>
                            <option value="reporte_stock">Reporte General de Stock</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Responsable del Cierre *</label>
                    <input required style={inputStyle} type="text" name="responsable" value={formData.responsable} onChange={handleChange} placeholder="Nombre del empleado/supervisor" />
                </div>

                {formData.tipoResumen.includes('cierre') && (
                    <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Efectivo Físico en Caja</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-gray)' }}>$</span>
                                <input required style={{ ...inputStyle, marginBottom: 0, paddingLeft: '1.5rem' }} type="number" step="0.01" min="0" name="efectivoCaja" value={formData.efectivoCaja} onChange={handleChange} placeholder="0.00" />
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Gastos del Día Ticket/Vale</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-gray)' }}>$</span>
                                <input required style={{ ...inputStyle, marginBottom: 0, paddingLeft: '1.5rem' }} type="number" step="0.01" min="0" name="gastosDia" value={formData.gastosDia} onChange={handleChange} placeholder="0.00" />
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label style={labelStyle}>Observaciones / Novedades</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="3" name="observaciones" value={formData.observaciones} onChange={handleChange} placeholder="Ej. Diferencia de $500 en caja, sobró mercancía, etc..."></textarea>
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
                    }}>
                        Guardar Resumen
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ResumenFormModal;
