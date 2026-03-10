import React from 'react';

const MapWidget = () => {
    return (
        <div className="map-widget">
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>Mapa de la Ruta del Reparto</div>
            <div className="map-placeholder">
                {/* En un entorno real, aquí se integraría Google Maps, Mapbox, o Leaflet */}
                <span>🗺️ Interactive Map Placeholder</span>
            </div>
            <button style={{
                padding: '0.75rem',
                backgroundColor: '#e5e7eb',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                marginTop: '0.5rem'
            }}>
                Ordenar este Reparto
            </button>
        </div>
    );
};

export default MapWidget;
