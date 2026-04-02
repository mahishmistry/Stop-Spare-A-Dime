import { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    onLogin();
  };

  const handleGoogleLogin = () => {
    // Simulate Google login
    onLogin();
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <div className="p-6">
        <div className="w-12 h-12 rounded-full bg-[#B3B3B3]"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-semibold text-gray-800 mb-12">Stop and Spare A Dime</h1>

        <div className="w-32 h-32 rounded-full bg-[#B3B3B3] flex items-center justify-center mb-12">
          <span className="text-gray-600">Logo</span>
        </div>

        <div className="w-full max-w-md bg-white border border-gray-300 rounded-lg p-8">
          <h2 className="text-center text-gray-800 mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <button type="button" className="text-gray-800 hover:text-[#6FBD7A] underline">
                Sign Up with Email
              </button>
              <button type="button" className="text-gray-800 hover:text-[#6FBD7A] underline">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#6FBD7A] text-white py-3 rounded-lg hover:bg-[#5da968] transition-colors mt-6"
            >
              Login
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-gray-300 bg-white text-gray-800 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Log in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
