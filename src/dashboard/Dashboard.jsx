import React from 'react';
import Header from './components/Header';
import StatCards from './components/StatCards';
import QuickActions from './components/QuickActions';
import TodayDeliveries from './components/TodayDeliveries';
import OrdersTable from './components/OrdersTable';
import MapWidget from './components/MapWidget';
import ClientesListModal from './components/ClientesListModal';
import VehiculosListModal from './components/VehiculosListModal';
import ZonasListModal from './components/ZonasListModal';
import UsuariosListModal from './components/UsuariosListModal';

const Dashboard = () => {
    const [showClientes, setShowClientes] = React.useState(false);
    const [showVehiculos, setShowVehiculos] = React.useState(false);
    const [showZonas, setShowZonas] = React.useState(false);
    const [showUsuarios, setShowUsuarios] = React.useState(false);

    return (
        <div className="dashboard-container">
            <Header />

            <main className="content">
                <h1 className="page-title">
                    <span>📦</span> Escritorio
                </h1>

                <StatCards
                    onOpenClientes={() => setShowClientes(true)}
                    onOpenVehiculos={() => setShowVehiculos(true)}
                    onOpenZonas={() => setShowZonas(true)}
                    onOpenUsuarios={() => setShowUsuarios(true)}
                />

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <button style={{
                        padding: '0.5rem 2rem',
                        backgroundColor: '#356bd6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                    }}>
                        Ver todas las estadísticas &gt;
                    </button>
                </div>

                <QuickActions />

                <div className="dashboard-grid">
                    <TodayDeliveries />
                    <OrdersTable />
                    <MapWidget />
                </div>
            </main>

            <ClientesListModal
                isOpen={showClientes}
                onClose={() => setShowClientes(false)}
            />
            <VehiculosListModal
                isOpen={showVehiculos}
                onClose={() => setShowVehiculos(false)}
            />
            <ZonasListModal
                isOpen={showZonas}
                onClose={() => setShowZonas(false)}
            />
            <UsuariosListModal
                isOpen={showUsuarios}
                onClose={() => setShowUsuarios(false)}
            />
        </div>
    );
};

export default Dashboard;
