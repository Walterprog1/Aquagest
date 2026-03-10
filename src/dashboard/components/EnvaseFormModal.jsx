import React, { useState } from 'react';
import Modal from './Modal';

const EnvaseFormModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        capacidad: '',
        tipoMaterial: 'plastico_retornable',
        costoReposicion: '',
        precioVentaSugerido: '',
        estado: 'activo'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Guardando envase:', formData);
        alert('Tipo de Envase registrado con éxito (Simulación)');
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
        <Modal isOpen={isOpen} onClose={onClose} title="💧 Registrar Nuevo Tipo de Envase">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Nombre del Envase *</label>
                        <input required style={inputStyle} type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Bidón 20L Premium" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Capacidad (Litros) *</label>
                        <input required style={inputStyle} type="number" step="0.5" min="0" name="capacidad" value={formData.capacidad} onChange={handleChange} placeholder="Ej. 20" />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Tipo de Material / Uso *</label>
                    <select required style={inputStyle} name="tipoMaterial" value={formData.tipoMaterial} onChange={handleChange}>
                        <option value="plastico_retornable">Plástico Retornable (PET/Policarbonato)</option>
                        <option value="vidrio_retornable">Vidrio Retornable (Sifones)</option>
                        <option value="descartable">Plástico Descartable</option>
                        <option value="dispenser">Máquina / Dispenser</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Costo de Reposición (Compra)</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-gray)' }}>$</span>
                            <input style={{ ...inputStyle, marginBottom: 0, paddingLeft: '1.5rem' }} type="number" step="0.01" min="0" name="costoReposicion" value={formData.costoReposicion} onChange={handleChange} placeholder="0.00" />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Precio Venta Sugerido (Lleno) *</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-gray)' }}>$</span>
                            <input required style={{ ...inputStyle, marginBottom: 0, paddingLeft: '1.5rem' }} type="number" step="0.01" min="0" name="precioVentaSugerido" value={formData.precioVentaSugerido} onChange={handleChange} placeholder="0.00" />
                        </div>
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Estado *</label>
                    <select required style={inputStyle} name="estado" value={formData.estado} onChange={handleChange}>
                        <option value="activo">Activo (En catálogo)</option>
                        <option value="inactivo">Inactivo / Descontinuado</option>
                    </select>
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
                        Guardar Envase
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EnvaseFormModal;
