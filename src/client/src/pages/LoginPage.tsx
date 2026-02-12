import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { Label } from '@shared/components/ui/label';
import { CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';

/**
 * LoginPage - User authentication form
 *
 * TODO: CUSTOMIZE - Update branding, logo, and error message styling
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { loginUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await loginUser({ email, password });
      // Redirection handled by useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 space-y-2">
        <CardTitle className="text-2xl font-bold text-center">
          {/* TODO: CUSTOMIZE - Replace with logo/brand name */}
          Welcome to BzFit
        </CardTitle>
        <CardDescription className="text-center">
          Sign in to track your meals and nutrition
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
