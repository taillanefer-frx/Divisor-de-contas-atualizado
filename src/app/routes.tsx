import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ConsentPage } from '@/features/legal/pages/ConsentPage';
import { PrivacyPage } from '@/features/legal/pages/PrivacyPage';
import { TermsPage } from '@/features/legal/pages/TermsPage';
import { CreateTablePage } from '@/features/tables/pages/CreateTablePage';
import { ShareTablePage } from '@/features/tables/pages/ShareTablePage';
import { TablePage } from '@/features/tables/pages/TablePage';
import { getLatestTableShareToken } from '@/lib/storage/tableSessionStorage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function HomeRedirect() {
  const latestShareToken = getLatestTableShareToken();
  return <Navigate to={latestShareToken ? `/mesa/${encodeURIComponent(latestShareToken)}` : '/mesas/nova'} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeRedirect />} />
        <Route path="/mesas/nova" element={<CreateTablePage />} />
        <Route path="/mesa/:shareToken" element={<TablePage />} />
        <Route path="/mesa/:shareToken/compartilhar" element={<ShareTablePage />} />
        <Route path="/legal/termos" element={<TermsPage />} />
        <Route path="/legal/privacidade" element={<PrivacyPage />} />
        <Route path="/legal/aceite" element={<ConsentPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
