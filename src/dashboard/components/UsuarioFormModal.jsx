import React, { useState } from 'react';
import Modal from './Modal';

const UsuarioFormModal = ({ isOpen, onClose, usuarioAEditar }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        rol: 'repartidor',
        estado: 'activo'
    });

    React.useEffect(() => {
        if (isOpen && usuarioAEditar) {
            setFormData({
                nombre: usuarioAEditar.nombre || '',
                apellido: usuarioAEditar.apellido || '',
                dni: usuarioAEditar.dni || '',
                email: usuarioAEditar.email || '',
                telefono: usuarioAEditar.telefono || '',
                rol: usuarioAEditar.rol || 'repartidor',
                estado: usuarioAEditar.estado || 'activo'
            });
        } else if (isOpen && !usuarioAEditar) {
            setFormData({
                nombre: '',
                apellido: '',
                dni: '',
                email: '',
                telefono: '',
                rol: 'repartidor',
                estado: 'activo'
            });
        }
    }, [isOpen, usuarioAEditar]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const usuariosGuardados = JSON.parse(localStorage.getItem('aquagest_usuarios') || '[]');

        if (usuarioAEditar) {
            const index = usuariosGuardados.findIndex(u => u.id === usuarioAEditar.id);
            if (index !== -1) {
                usuariosGuardados[index] = { ...usuarioAEditar, ...formData };
            }
        } else {
            const nuevoUsuario = {
                ...formData,
                id: Date.now().toString(),
                fechaRegistro: new Date().toISOString()
            };
            usuariosGuardados.push(nuevoUsuario);
        }

        localStorage.setItem('aquagest_usuarios', JSON.stringify(usuariosGuardados));

        alert(usuarioAEditar ? '¡Usuario actualizado con éxito!' : '¡Usuario registrado con éxito!');
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
        <Modal isOpen={isOpen} onClose={onClose} title="👤 Registrar Nuevo Usuario">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Nombres *</label>
                        <input required style={inputStyle} type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Juan" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Apellidos *</label>
                        <input required style={inputStyle} type="text" name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Ej. Pérez" />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>DNI *</label>
                        <input required style={inputStyle} type="text" name="dni" value={formData.dni} onChange={handleChange} placeholder="Sin puntos" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Teléfono *</label>
                        <input required style={inputStyle} type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej. 1123456789" />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Correo Electrónico *</label>
                    <input required style={inputStyle} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="usuario@email.com" />
                </div>

                <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Rol del Usuario *</label>
                        <select required style={{ ...inputStyle, marginBottom: 0 }} name="rol" value={formData.rol} onChange={handleChange}>
                            <option value="administrador">Administrador</option>
                            <option value="repartidor">Repartidor (Chofer)</option>
                            <option value="atencion">Atención al Cliente / Mostrador</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Estado Inicial *</label>
                        <select required style={{ ...inputStyle, marginBottom: 0 }} name="estado" value={formData.estado} onChange={handleChange}>
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo / Suspendido</option>
                        </select>
                    </div>
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
                        Crear Usuario
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UsuarioFormModal;
