import { useState } from 'react';
import './App.css';
import {BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/general/HeaderV';
import BuildingsPage from './pages/BuildingsPage';
import GeoAnalysisPage from './pages/GeoAnalysisPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [selectedDistrict, setSelectedDistrict] = useState("Все районы");
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App h-full w-full flex flex-col overflow-hidden">
          <Header setSelectedDistrict={setSelectedDistrict} selectedDistrict={selectedDistrict}/>
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/pmsp/buildings" replace />} />
              <Route path="/pmsp/buildings" element={<BuildingsPage/>}/>
              <Route path="/pmsp/geo-analysis" element={<GeoAnalysisPage/>}/>
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
