import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import VehicleDetail from './pages/VehicleDetail'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/"                    element={<Dashboard />} />
            <Route path="/vehicles"            element={<Vehicles />} />
            <Route path="/vehicles/:vehicleId" element={<VehicleDetail />} />
            <Route path="/analytics"           element={<Analytics />} />
            <Route path="/alerts"              element={<Alerts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
