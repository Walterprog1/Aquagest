import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ClienteFormModal from './ClienteFormModal';
import { supabase } from '../../lib/supabase';

const ClientesListModal = ({ isOpen, onClose }) => {
    const [clientes, setClientes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [clienteAEditar, setClienteAEditar] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const cargarClientes = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setClientes(data || []);
        } catch (error) {
            console.error("Error al cargar clientes:", error);
            // alert("No se pudieron cargar los clientes.");
        } finally {
            setIsLoading(false);
        }
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

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
            try {
                const { error } = await supabase
                    .from('clientes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                cargarClientes();
            } catch (error) {
                console.error("Error al eliminar cliente:", error);
                alert("No se pudo eliminar el cliente.");
            }
        }
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setClienteAEditar(null);
        cargarClientes();
    };

    const filteredClientes = clientes.filter(cliente =>
        (cliente.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.direccion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                                    <td style={tdStyle}>
                                        <strong>{cliente.nombre}</strong>
                                        {cliente.alias_transferencia && (
                                            <div style={{ fontSize: '0.7rem', color: '#c2410c', background: '#fff7ed', padding: '2px 4px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                                                ID Pago: {cliente.alias_transferencia}
                                            </div>
                                        )}
                                    </td>
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
                                    <td style={tdStyle}>
                                        <div 
                                            onClick={() => {
                                                if (!cliente.whatsapp && !cliente.telefono) return;
                                                const cleanNum = (cliente.whatsapp || cliente.telefono).replace(/\D/g, '');
                                                const finalNum = cleanNum.startsWith('54') ? cleanNum : `549${cleanNum}`;
                                                window.open(`https://wa.me/${finalNum}`, '_blank');
                                            }}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                color: '#16a34a', 
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                backgroundColor: '#f0fdf4',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid #dcfce7',
                                                fontSize: '0.8rem'
                                            }}
                                            title="Enviar WhatsApp"
                                        >
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                            </svg>
                                            {cliente.whatsapp || cliente.telefono}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        {cliente.precio_especial ? `$${cliente.precio_especial}` : '-'}
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
