import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import UsuarioFormModal from './UsuarioFormModal';

const UsuariosListModal = ({ isOpen, onClose }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [usuarioAEditar, setUsuarioAEditar] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const cargarUsuarios = () => {
        const guardados = JSON.parse(localStorage.getItem('aquagest_usuarios') || '[]');
        setUsuarios(guardados);
    };

    useEffect(() => {
        if (isOpen) {
            cargarUsuarios();
        }
    }, [isOpen]);

    const handleEdit = (usuario) => {
        setUsuarioAEditar(usuario);
        setIsEditModalOpen(true);
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setUsuarioAEditar(null);
        cargarUsuarios();
    };

    const filteredUsuarios = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.rol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '1rem',
        fontSize: '0.875rem'
    };

    const thStyle = {
        textAlign: 'left',
        padding: '0.75rem',
        borderBottom: '2px solid var(--border-color)',
        color: 'var(--text-gray)',
        fontWeight: '600'
    };

    const tdStyle = {
        padding: '0.75rem',
        borderBottom: '1px solid var(--border-color)'
    };

    const getRoleLabel = (rol) => {
        switch (rol) {
            case 'administrador': return 'Admin';
            case 'repartidor': return 'Repartidor';
            case 'atencion': return 'Atención';
            default: return rol;
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="👥 Gestión de Usuarios">
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por nombre, email o rol..."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-md)',
                            fontSize: '1rem'
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Nombre y Apellido</th>
                                <th style={thStyle}>DNI</th>
                                <th style={thStyle}>Rol</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsuarios.length > 0 ? filteredUsuarios.map(u => (
                                <tr key={u.id}>
                                    <td style={tdStyle}>
                                        <strong>{u.nombre} {u.apellido}</strong>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{u.email}</div>
                                    </td>
                                    <td style={tdStyle}>{u.dni}</td>
                                    <td style={tdStyle}>{getRoleLabel(u.rol)}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            backgroundColor: u.estado === 'activo' ? '#d1fae5' : '#fee2e2',
                                            color: u.estado === 'activo' ? '#065f46' : '#991b1b'
                                        }}>
                                            {u.estado.charAt(0).toUpperCase() + u.estado.slice(1)}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => handleEdit(u)}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#f3f4f6',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            ✏️ Editar
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                    <button onClick={onClose} style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>
                        Cerrar
                    </button>
                </div>
            </Modal>

            <UsuarioFormModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEdit}
                usuarioAEditar={usuarioAEditar}
            />
        </>
    );
};

export default UsuariosListModal;
