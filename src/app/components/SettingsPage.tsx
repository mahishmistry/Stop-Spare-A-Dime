import { Header } from './Header';

interface SettingsPageProps {
  location: string;
  onLocationChange: (location: string) => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onHomeClick: () => void;
  onSettingsClick: () => void;
}

// Header on top of page. The rest needs to be implemented.
export function SettingsPage(props: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Header {...props} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      </main>
    </div>
  );
}