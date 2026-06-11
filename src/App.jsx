import { useState } from 'react';
import './App.css';
import {BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/general/HeaderV';
import BuildingsPagePMSP from './pages/BuildingsPagePMSP';
import GeoAnalysisPagePMSP from './pages/GeoAnalysisPagePMSP';
import BuildingsPageHospitals from './pages/BuildingsPageHospitals';
import GeoAnalysisPageHospitals from './pages/GeoAnalysisPageHospitals';

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
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App h-full w-full flex flex-col overflow-hidden">
          <Header/>
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/pmsp/buildings" replace />} />
              <Route path="/pmsp/buildings" element={<BuildingsPagePMSP/>}/>
              <Route path="/pmsp/geo-analysis" element={<GeoAnalysisPagePMSP/>}/>
              <Route path="/hospitals/buildings" element={<BuildingsPageHospitals/>}/>
              <Route path="/hospitals/geo-analysis" element={<GeoAnalysisPageHospitals/>}/>
              <Route path="*" element={<Navigate to="/pmsp/buildings" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
