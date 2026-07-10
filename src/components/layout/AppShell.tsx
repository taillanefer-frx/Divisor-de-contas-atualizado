import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';

export function AppShell() {
  return (
    <div className="min-h-dvh bg-surface-canvas text-ink-body">
      <Header />
      <main className="mx-auto grid w-full max-w-5xl gap-5 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
