"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Lock } from 'lucide-react'; // Removed Google
import { toast } from 'sonner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
      navigate('/'); // Redirect to dashboard or home page
    } catch (error: any) {
      console.error('Email login failed:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in with Google successfully!');
      navigate('/'); // Redirect to dashboard or home page
    } catch (error: any) {
      console.error('Google login failed:', error);
      let errorMessage = 'Google login failed.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google login window closed.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Google login cancelled.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md card-shadow border border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-lilac bg-clip-text text-transparent">
            FinanceFlow
          </CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Log in to manage your finances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground min-h-[44px]" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>

          <div className="flex items-center my-6">
            <Separator className="flex-1" />
            <span className="px-3 text-xs text-muted-foreground uppercase">OR</span>
            <Separator className="flex-1" />
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 bg-muted/50 hover:bg-muted text-foreground min-h-[44px]"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {/* Removed Google icon */}
            Sign in with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <a href="#" className="text-primary hover:underline">Sign Up</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;