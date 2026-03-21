import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const WhatsappMassiveModal = ({ isOpen, onClose }) => {
    const [clientes, setClientes] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [colaEnvio, setColaEnvio] = useState([]);
    const [indiceActual, setIndiceActual] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());

    const cargarClientes = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('id, nombre, whatsapp, tipo')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setClientes(data || []);
            // Por defecto, seleccionar todos
            if (data) {
                setSelectedIds(new Set(data.map(c => c.id)));
            }
        } catch (error) {
            console.error("Error cargando clientes para masivo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            cargarClientes();
            setMensaje('');
            setColaEnvio([]);
            setIndiceActual(0);
            setSearchTerm('');
        }
    }, [isOpen]);

    const toggleCliente = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleTodos = () => {
        if (selectedIds.size === clientes.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(clientes.map(c => c.id)));
        }
    };

    const iniciarDifusion = () => {
        if (!mensaje.trim()) {
            alert("Por favor, escribe un mensaje.");
            return;
        }
        
        const seleccionados = clientes.filter(c => selectedIds.has(c.id));
        if (seleccionados.length === 0) {
            alert("No has seleccionado ningún cliente.");
            return;
        }

        const confirmacion = window.confirm(`Vas a preparar una difusión para ${seleccionados.length} clientes. ¿Continuar?`);
        if (confirmacion) {
            setColaEnvio(seleccionados);
            setIndiceActual(0);
        }
    };

    const enviarSiguiente = () => {
        const cliente = colaEnvio[indiceActual];
        if (!cliente) return;

        const num = cliente.whatsapp.replace(/\D/g, '');
        const finalNum = num.startsWith('54') ? num : `549${num}`;
        const encodedMsg = encodeURIComponent(mensaje);
        
        window.open(`https://wa.me/${finalNum}?text=${encodedMsg}`, '_blank');

        if (indiceActual < colaEnvio.length - 1) {
            setIndiceActual(prev => prev + 1);
        } else {
            alert("¡Difusión finalizada!");
            setColaEnvio([]);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        marginBottom: '1rem',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        fontFamily: 'inherit'
    };

    const filteredClients = clientes.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📢 Mensajería Masiva WhatsApp">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {colaEnvio.length === 0 ? (
                    <>
                        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold' }}>1. Seleccionar Destinatarios ({selectedIds.size})</label>
                                <button 
                                    onClick={toggleTodos}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                                >
                                    {selectedIds.size === clientes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                </button>
                            </div>
                            
                            <input 
                                type="text"
                                placeholder="🔍 Buscar cliente..."
                                style={{ ...inputStyle, marginBottom: '0.5rem', padding: '0.5rem' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px', backgroundColor: 'white' }}>
                                {filteredClients.map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => toggleCliente(c.id)}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            padding: '8px 12px', 
                                            borderBottom: '1px solid #f8fafc',
                                            cursor: 'pointer',
                                            backgroundColor: selectedIds.has(c.id) ? '#f0f9ff' : 'transparent'
                                        }}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(c.id)} 
                                            onChange={() => {}} // Handle by parent div
                                            style={{ marginRight: '10px' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{c.nombre}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{c.whatsapp} • <span style={{ textTransform: 'capitalize' }}>{c.tipo}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>2. Escribir Mensaje General</label>
                            <textarea 
                                style={{ ...inputStyle, resize: 'none', height: '100px' }}
                                placeholder="Escribe aquí tu mensaje..."
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                            ></textarea>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>💡 Puedes usar emojis 🏠📦🧴 para que sea más amigable.</p>
                        </div>

                        <button 
                            onClick={iniciarDifusion}
                            disabled={isLoading || selectedIds.size === 0}
                            style={{
                                padding: '1rem',
                                backgroundColor: 'var(--primary-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                opacity: (isLoading || selectedIds.size === 0) ? 0.6 : 1
                            }}
                        >
                            🚀 Preparar Difusión ({selectedIds.size} destinatarios)
                        </button>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📦 Cola de Envío</h2>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                                {indiceActual + 1} de {colaEnvio.length}
                            </div>
                            <div style={{ color: '#64748b' }}>Preparado para: <strong>{colaEnvio[indiceActual]?.nombre}</strong></div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button 
                                onClick={enviarSiguiente}
                                style={{
                                    padding: '1rem 2rem',
                                    backgroundColor: '#25d366',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem'
                                }}
                            >
                                {indiceActual === 0 ? '▶️ Abrir WhatsApp' : '⏭️ Abrir Siguiente'}
                            </button>
                            <button 
                                onClick={() => setColaEnvio([])}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: '#94a3b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                            ⚠️ Se abrirá una pestaña nueva para cada envío. Dale a "Enviar" en WhatsApp y vuelve aquí para el siguiente.
                        </p>
                    </div>
                )}

            </div>
        </Modal>
    );
};

export default WhatsappMassiveModal;
