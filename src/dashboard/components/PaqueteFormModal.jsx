import React, { useState } from 'react';
import Modal from './Modal';

const PaqueteFormModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precioPaquete: '',
        estado: 'activo'
    });

    const [items, setItems] = useState([
        { tipoEnvase: '', cantidad: 1 }
    ]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { tipoEnvase: '', cantidad: 1 }]);
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Guardando paquete:', { ...formData, items });
        alert('Paquete/Combo registrado con éxito (Simulación)');
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
        <Modal isOpen={isOpen} onClose={onClose} title="📦 Crear Paquete / Combo de Productos">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Nombre del Paquete *</label>
                        <input required style={inputStyle} type="text" name="nombre" value={formData.nombre} onChange={handleFormChange} placeholder="Ej. Combo Familiar (2x20L + 1 Dispenser)" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Precio Promocional *</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-gray)' }}>$</span>
                            <input required style={{ ...inputStyle, paddingLeft: '1.5rem' }} type="number" step="0.01" min="0" name="precioPaquete" value={formData.precioPaquete} onChange={handleFormChange} placeholder="0.00" />
                        </div>
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Descripción Corta</label>
                    <input style={inputStyle} type="text" name="descripcion" value={formData.descripcion} onChange={handleFormChange} placeholder="Ej. Ideal para el hogar, rinde 40 litros..." />
                </div>

                <div style={{ backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <label style={{ ...labelStyle, marginBottom: '1rem', color: 'var(--primary-blue)' }}>Artículos incluidos en el Paquete</label>

                    {items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ flex: 2 }}>
                                <select required style={{ ...inputStyle, marginBottom: 0 }} value={item.tipoEnvase} onChange={(e) => handleItemChange(index, 'tipoEnvase', e.target.value)}>
                                    <option value="">Seleccionar Envase...</option>
                                    <option value="bidon_20l">Bidón 20L</option>
                                    <option value="bidon_12l">Bidón 12L</option>
                                    <option value="sifon">Sifón de Soda</option>
                                    <option value="dispenser">Dispenser de Pie</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <input required style={{ ...inputStyle, marginBottom: 0 }} type="number" min="1" value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} placeholder="Cant." />
                            </div>
                            {items.length > 1 && (
                                <button type="button" onClick={() => removeItem(index)} style={{ padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    X
                                </button>
                            )}
                        </div>
                    ))}

                    <button type="button" onClick={addItem} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: 'transparent', border: '1px dashed var(--primary-blue)', color: 'var(--primary-blue)', borderRadius: '4px', cursor: 'pointer' }}>
                        + Añadir otro artículo
                    </button>
                </div>

                <div>
                    <label style={labelStyle}>Estado *</label>
                    <select required style={inputStyle} name="estado" value={formData.estado} onChange={handleFormChange}>
                        <option value="activo">Activo (Disponible para venta)</option>
                        <option value="inactivo">Inactivo / Promoción Finalizada</option>
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
                        Crear Paquete
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PaqueteFormModal;
