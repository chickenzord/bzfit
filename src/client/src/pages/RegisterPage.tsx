import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card'; // Import CardHeader and CardTitle

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { registerUser, isAuthenticated } = useAuth();
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
      await registerUser({ name, email, password });
      // Redirection handled by useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">Register</CardTitle>
        <CardDescription className="text-center text-muted-foreground">Create your account</CardDescription>
      </CardHeader>
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2 text-left">
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2 text-left">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login here
          </Link>
          .
        </p>
      </div>
    </>
  );
}
