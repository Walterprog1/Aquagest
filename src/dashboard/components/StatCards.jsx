import React from 'react';

const StatCard = ({ title, value, colorClass, linkLabel, onClick, onSecondaryClick, secondaryLinkLabel }) => (
    <div className={`stat-card ${colorClass}`} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <div className="stat-content">
            <h3 className="stat-title">{title}</h3>
            <div className="stat-value">{value}</div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                {linkLabel && (
                    <span
                        className="stat-link"
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        style={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', textDecoration: 'underline' }}
                    >
                        {linkLabel}
                    </span>
                )}
                {secondaryLinkLabel && (
                    <span
                        className="stat-link"
                        onClick={(e) => { e.stopPropagation(); onSecondaryClick(); }}
                        style={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', opacity: 0.8, textDecoration: 'underline' }}
                    >
                        {secondaryLinkLabel}
                    </span>
                )}
            </div>
        </div>
        <div className="stat-icon-bg"></div>
    </div>
);

const StatCards = ({ onOpenClientes, onOpenVehiculos, onOpenZonas, onOpenUsuarios }) => {
    const [stats, setStats] = React.useState({
        pedidosPendientes: 0,
        clientesRegistrados: 0,
        vehiculosRegistrados: 0,
        zonasRegistradas: 0,
        usuariosRegistrados: 0,
        ingresoDia: 0
    });

    React.useEffect(() => {
        const calcularStats = () => {
            const hoy = new Date().toLocaleDateString();
            const clientes = JSON.parse(localStorage.getItem('aquagest_clientes') || '[]');
            const pedidos = JSON.parse(localStorage.getItem('aquagest_pedidos') || '[]');
            const vehiculos = JSON.parse(localStorage.getItem('aquagest_vehiculos') || '[]');
            const zonas = JSON.parse(localStorage.getItem('aquagest_zonas') || '[]');
            const usuarios = JSON.parse(localStorage.getItem('aquagest_usuarios') || '[]');

            const pendientes = pedidos.filter(p => p.status === 'Pendiente').length;
            const income = pedidos
                .filter(p => p.created && p.created.startsWith(hoy.slice(0, 8)) && p.status !== 'Anulado')
                .reduce((acc, curr) => acc + (curr.total || 0), 0);

            setStats({
                pedidosPendientes: pendientes,
                clientesRegistrados: clientes.length,
                vehiculosRegistrados: vehiculos.length,
                zonasRegistradas: zonas.length,
                usuariosRegistrados: usuarios.length,
                ingresoDia: income
            });
        };

        calcularStats();
        const interval = setInterval(calcularStats, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="stats-grid">
            <StatCard
                title="Pedidos Pendientes"
                value={stats.pedidosPendientes}
                colorClass="dark-blue"
                linkLabel={`Ingresos Hoy: $${stats.ingresoDia.toFixed(0)}`}
                onClick={() => { }}
            />
            <StatCard
                title="Clientes y Staff"
                value={`${stats.clientesRegistrados} / ${stats.usuariosRegistrados}`}
                colorClass="orange"
                linkLabel="Clientes"
                onClick={onOpenClientes}
                secondaryLinkLabel="Staff/Usuarios"
                onSecondaryClick={onOpenUsuarios}
            />
            <StatCard
                title="Vehículos"
                value={stats.vehiculosRegistrados}
                colorClass="light-blue"
                linkLabel="Gestionar Lista"
                onClick={onOpenVehiculos}
            />
            <StatCard
                title="Zonas de Reparto"
                value={stats.zonasRegistradas}
                colorClass="dark-blue"
                linkLabel="Ver Mapa/Lista"
                onClick={onOpenZonas}
            />
        </div>
    );
};

export default StatCards;
