import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useStore } from './store/useStore';
import Layout    from './components/Layout';
import Login     from './pages/auth/Login';
import VNCalc    from './pages/calculator/VNCalc';
import SGCalc    from './pages/calculator/SGCalc';
import RecCalc   from './pages/calculator/RecCalc';
import SavedData from './pages/data/SavedData';
import ManualTool  from './pages/tools/ManualTool';
import { MarginSettings, RateSettings, FeeSettings } from './pages/settings/Settings';

import './styles/global.css';

const IS_DEV = import.meta.env.DEV;
import CrawlData from './pages/data/CrawlData';
const CrawlTool = IS_DEV ? React.lazy(() => import('./pages/tools/CrawlTool')) : null;

function ProtectedRoute({ children }) {
  const token = useStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* 보호된 라우트 — 레이아웃 포함 */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={null}>
                  <Routes>
                    <Route path="/"               element={<Navigate to="/calc/sg" replace />} />
                    <Route path="/calc/vn"        element={<VNCalc />} />
                    <Route path="/calc/sg"        element={<SGCalc />} />
                    <Route path="/calc/rec"       element={<RecCalc />} />
                    <Route path="/data/saved"     element={<SavedData />} />
                    <Route path="/data/crawl"     element={<CrawlData />} />
                    {IS_DEV && <Route path="/tools/crawl" element={<CrawlTool />} />}
                    <Route path="/tools/manual"   element={<ManualTool />} />
                    <Route path="/settings/margin" element={<MarginSettings />} />
                    <Route path="/settings/rate"   element={<RateSettings />} />
                    <Route path="/settings/fee"    element={<FeeSettings />} />
                    </Routes>
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
