import { useState } from 'react';
import { signIn, signOut } from '../lib/supabase';
import { colors } from '../lib/design-system';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  }

  // Pre-fill with test account credentials for demo
  const handleTestAccount = () => {
    setEmail('admin@fileinasnap.test');
    setPassword('FileInASnap2024!Admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.primary.blue }}
            >
              <img 
                src="/icons/logo-fileinasnap.png" 
                alt="FileInASnap" 
                className="w-10 h-10 filter brightness-0 invert"
              />
            </div>
          </div>
          
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: colors.text.primary }}
          >
            Welcome to FileInASnap
          </h1>
          <p style={{ color: colors.text.secondary }}>
            Sign in to access your enhanced file management dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div 
              className="p-4 rounded-lg text-sm"
              style={{ 
                backgroundColor: `${colors.status.danger}15`,
                color: colors.status.danger 
              }}
            >
              {error}
            </div>
          )}
          
          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.text.primary }}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail 
                className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                size={18} 
                color={colors.text.muted}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ 
                  borderColor: colors.primary.lightGray,
                  '--tw-ring-color': colors.primary.blue 
                } as React.CSSProperties}
                placeholder="Enter your email"
              />
            </div>
          </div>
          
          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.text.primary }}
            >
              Password
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                size={18} 
                color={colors.text.muted}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ 
                  borderColor: colors.primary.lightGray,
                  '--tw-ring-color': colors.primary.blue 
                } as React.CSSProperties}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.text.muted} />
                ) : (
                  <Eye size={18} color={colors.text.muted} />
                )}
              </button>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: colors.primary.blue,
              color: 'white'
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Test Account Helper */}
        <div 
          className="p-4 rounded-lg text-center"
          style={{ backgroundColor: colors.background.accent }}
        >
          <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
            For demo purposes, you can use a test account:
          </p>
          <button
            onClick={handleTestAccount}
            className="text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: `${colors.primary.teal}15`,
              color: colors.primary.teal
            }}
          >
            Use Test Account
          </button>
          <div className="text-xs mt-2 space-y-1" style={{ color: colors.text.muted }}>
            <div>Email: admin@fileinasnap.test</div>
            <div>Password: FileInASnap2024!Admin</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs" style={{ color: colors.text.muted }}>
            Enhanced FileInASnap Dashboard with SparkleShare-inspired design
          </p>
        </div>
      </div>
    </div>
  );
}