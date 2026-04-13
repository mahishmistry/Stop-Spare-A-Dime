import { useState } from 'react';
import { Eye, EyeOff } from "lucide-react"; // https://lucide.dev/icons/?search=eye

interface LoginPageProps {
  onLogin: () => void; // if login succeeds -- authenticated and no longer show login page
  onBack: () => void; // if closing -- don't show login page -- no change to authenticated state
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false); // sign up prompt
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // login logic and catching sign up errors to print
  const handleSubmit = (e: any) => {
    e.preventDefault();
    setError('');

    if (isSignUp) { // prints custom errors for sign up if any
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      // sign up — replace with real API call later
      onLogin();
    } else { // logging in.
      // login — replace with real API call later
      onLogin();
    }
  };

  const handleGoogleLogin = () => {
    // Google login — replace with real OAuth later
    onLogin();
  };

  // switch and clear info for switching between login/signup
  const switchMode = () => {
    setIsSignUp(!isSignUp); // switches the UI for login page.
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col overflow-y-auto">
      <div className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#6FBD7A] transition-colors text-sm"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <h1 className="text-2xl sm:text-4xl font-semibold text-gray-800 mb-8 text-center">
          Stop and Spare A Dime
        </h1>

        <img
          src="../logo.png"
          alt="Stop Spare A Dime Logo"
          className="w-24 h-24 sm:w-32 sm:h-32 object-contain mb-8"
          style={{ position: 'relative', top: '1px' }}
        />

        <div className="w-full max-w-md bg-white border border-gray-300 rounded-lg p-8">
          <h2 className="text-center text-gray-800 mb-6">
            {isSignUp ? 'Create Account' : 'Login'} 
          </h2>

          {/* Custom errors: If theres an error (so current error useState != ''), print the error.
          PRINTS ABOVE THE FORM and below header Create Acc/Login
          If confused about syntax see: Conditional rendering section https://react.dev/learn */}
          {error ? (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          ) : null}

          {/* onSubmit lets us catch any custom errors if any, and lets us do login logic*/}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If confused about syntax see: Conditional rendering section https://react.dev/learn */}
            {/* What to display on forum depending if signing up or logging in: */}
            {/* if signing up: ask for name */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent"
                  required
                />
              </div>
            )}

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
              <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
            </div>

            {/* if signing up: ask for confirmed password */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Confirm Password:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* if logging in: forgot password option */}
            {!isSignUp && (
              <div className="flex items-center justify-end text-sm">
                <button type="button" className="text-gray-800 hover:text-[#6FBD7A] underline">
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#6FBD7A] text-white py-3 rounded-lg hover:bg-[#5da968] transition-colors mt-2"
            >
              {isSignUp ? 'Create Account' : 'Login'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Google login/signup button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-gray-300 bg-white text-gray-800 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              {/* Given from figma: the google auth button code + coloring etc*/}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSignUp ? 'Sign up with Google' : 'Log in with Google'}
            </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-[#6FBD7A] hover:underline font-medium"
              >
                {isSignUp ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}