import { Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';

// Create a client for react-query
const queryClient = new QueryClient();

function App() {
  const theme = useThemeStore((state) => state.theme);

  // Effect to update the class on the <html> element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <main className="min-h-screen bg-background text-foreground">
        <Outlet /> {/* This is where the routed components will be rendered */}
      </main>
    </QueryClientProvider>
  );
}

export default App;


