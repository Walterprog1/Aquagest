import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const WhatsappMassiveModal = ({ isOpen, onClose }) => {
    const [clientes, setClientes] = useState([]);
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [mensaje, setMensaje] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [colaEnvio, setColaEnvio] = useState([]);
    const [indiceActual, setIndiceActual] = useState(0);

    const cargarClientes = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('id, nombre, whatsapp, tipo')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setClientes(data || []);
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
        }
    }, [isOpen]);

    const clientesFiltrados = clientes.filter(c => 
        filtroTipo === 'todos' || c.tipo === filtroTipo
    );

    const iniciarDifusion = () => {
        if (!mensaje.trim()) {
            alert("Por favor, escribe un mensaje.");
            return;
        }
        if (clientesFiltrados.length === 0) {
            alert("No hay clientes en el grupo seleccionado.");
            return;
        }

        const confirmacion = window.confirm(`Vas a preparar una difusión para ${clientesFiltrados.length} clientes. Tendrás que pulsar "Siguiente" para cada uno. ¿Continuar?`);
        if (confirmacion) {
            setColaEnvio(clientesFiltrados);
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📢 Mensajería Masiva WhatsApp">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {colaEnvio.length === 0 ? (
                    <>
                        <div style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0369a1' }}>1. Seleccionar Grupo</label>
                            <select style={inputStyle} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                                <option value="todos">Todos los Clientes ({clientes.length})</option>
                                <option value="residencial">Solo Residenciales ({clientes.filter(c => c.tipo === 'residencial').length})</option>
                                <option value="comercial">Solo Comerciales ({clientes.filter(c => c.tipo === 'comercial').length})</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>2. Escribir Mensaje General</label>
                            <textarea 
                                style={{ ...inputStyle, resize: 'none', height: '120px' }}
                                placeholder="Hola! Te informamos que..."
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                            ></textarea>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>💡 Puedes usar emojis 🏠📦🧴 para que sea más amigable.</p>
                        </div>

                        <button 
                            onClick={iniciarDifusion}
                            disabled={isLoading}
                            style={{
                                padding: '1rem',
                                backgroundColor: 'var(--primary-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            🚀 Preparar Difusión ({clientesFiltrados.length} destinatarios)
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
