import { AppRoutes } from '@/app/routes';
import { RealtimeProvider } from '@/app/providers/RealtimeProvider';
import { SupabaseProvider } from '@/app/providers/SupabaseProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

export function App() {
  return (
    <ThemeProvider>
      <SupabaseProvider>
        <RealtimeProvider>
          <AppRoutes />
        </RealtimeProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}
