import React from 'react';
import Modal from './Modal';

const ResumenRepartoModal = ({ isOpen, onClose, reparto }) => {
    if (!reparto) return null;

    const cardStyle = {
        backgroundColor: '#f8fafc',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        padding: '1rem',
        textAlign: 'center',
        flex: 1
    };

    const numberStyle = {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: 'var(--primary-blue)',
        margin: '0.5rem 0'
    };

    const labelStyle = {
        fontSize: '0.75rem',
        color: 'var(--text-gray)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`📋 Resumen del Reparto: ${reparto.id}`}>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                <p><strong>Repartidor:</strong> {reparto.repartidor}</p>
                <p><strong>Fecha/Hora:</strong> {reparto.fecha}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={cardStyle}>
                    <div style={{ fontSize: '1.5rem' }}>💧</div>
                    <div style={numberStyle}>{reparto.stats.bidonesVendidos}</div>
                    <div style={labelStyle}>Bidones Vendidos</div>
                </div>

                <div style={cardStyle}>
                    <div style={{ fontSize: '1.5rem' }}>💵</div>
                    <div style={numberStyle}>${reparto.stats.pagosRecibidos}</div>
                    <div style={labelStyle}>Pagos Recibidos</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={cardStyle}>
                    <div style={{ fontSize: '1.5rem' }}>📉</div>
                    <div style={numberStyle}>${reparto.stats.deudasGeneradas}</div>
                    <div style={labelStyle}>Deudas (Fiado)</div>
                </div>

                <div style={cardStyle}>
                    <div style={{ fontSize: '1.5rem' }}>🔄</div>
                    <div style={numberStyle}>{reparto.stats.bidonesPrestados}</div>
                    <div style={labelStyle}>Bidones Prestados</div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--primary-blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    cursor: 'pointer',
                    fontWeight: '500'
                }}>
                    Cerrar Resumen
                </button>
            </div>
        </Modal>
    );
};

export default ResumenRepartoModal;
