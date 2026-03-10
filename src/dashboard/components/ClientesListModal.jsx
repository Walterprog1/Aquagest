import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ClienteFormModal from './ClienteFormModal';

const ClientesListModal = ({ isOpen, onClose }) => {
    // ... (estados previos)
    const [clientes, setClientes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [clienteAEditar, setClienteAEditar] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // ... (funciones previas)
    const cargarClientes = () => {
        const guardados = JSON.parse(localStorage.getItem('aquagest_clientes') || '[]');
        setClientes(guardados);
    };

    useEffect(() => {
        if (isOpen) {
            cargarClientes();
        }
    }, [isOpen]);

    const handleEdit = (cliente) => {
        setClienteAEditar(cliente);
        setIsEditModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
            const guardados = JSON.parse(localStorage.getItem('aquagest_clientes') || '[]');
            const actualizados = guardados.filter(c => c.id !== id);
            localStorage.setItem('aquagest_clientes', JSON.stringify(actualizados));
            cargarClientes();
        }
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setClienteAEditar(null);
        cargarClientes();
    };

    const filteredClientes = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.localidad && cliente.localidad.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Estilos de la tabla
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

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="👥 Listado de Clientes Registrados">
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por nombre, dirección o localidad..."
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
                                <th style={thStyle}>Nombre</th>
                                <th style={thStyle}>Dirección / Localidad</th>
                                <th style={thStyle}>Ubicación</th>
                                <th style={thStyle}>Teléfono</th>
                                <th style={thStyle}>Precio</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClientes.length > 0 ? filteredClientes.map(cliente => (
                                <tr key={cliente.id}>
                                    <td style={tdStyle}><strong>{cliente.nombre}</strong></td>
                                    <td style={tdStyle}>
                                        {cliente.direccion}
                                        {cliente.localidad && <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{cliente.localidad}</div>}
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => {
                                                const query = cliente.localidad
                                                    ? `${cliente.direccion}, ${cliente.localidad}`
                                                    : cliente.direccion;
                                                const url = cliente.lat && cliente.lng
                                                    ? `https://www.google.com/maps/search/?api=1&query=${cliente.lat},${cliente.lng}`
                                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
                                                window.open(url, '_blank');
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#e0f2fe',
                                                color: '#0369a1',
                                                border: '1px solid #bae6fd',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            title={cliente.lat ? "Abrir coordenadas GPS" : "Buscar dirección en Maps"}
                                        >
                                            📍 Ver Maps
                                        </button>
                                    </td>
                                    <td style={tdStyle}>{cliente.telefono}</td>
                                    <td style={tdStyle}>
                                        {cliente.precioEspecialBidon20L ? `$${cliente.precioEspecialBidon20L}` : '-'}
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEdit(cliente)}
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
                                            <button
                                                onClick={() => handleDelete(cliente.id)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#fee2e2',
                                                    color: '#991b1b',
                                                    border: '1px solid #fecaca',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                🗑️ Borrar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                                        No hay resultados.
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

            <ClienteFormModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEdit}
                clienteAEditar={clienteAEditar}
            />
        </>
    );
};

export default ClientesListModal;
