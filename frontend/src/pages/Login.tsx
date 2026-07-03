import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CalendarDays, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'MANAGER') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Show session expired notification if query param is present
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast.warning('Your session has expired. Please login again.');
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    try {
      const loggedUser = await login(data.email, data.password);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      if (loggedUser.role === 'MANAGER') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setLoginError(errMsg);
      toast.error(errMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-slate-100 via-slate-50 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20 p-4 transition-colors duration-250">
      <div className="w-full max-w-md animate-fadeIn">
        <Card className="border-slate-200/60 dark:border-slate-800/80 shadow-xl overflow-hidden glass">
          <div className="h-1.5 bg-gradient-to-r from-primary to-purple-600"></div>
          <CardHeader className="space-y-2 text-center pt-8 pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
              <CalendarDays className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-750 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
              Welcome to LeaveFlow
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Sign in to manage leave balances, requests, and schedules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8">
            {loginError && (
              <div className="flex items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p className="font-medium">{loginError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Work Email
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus-visible:ring-primary'}
                  disabled={isSubmitting}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus-visible:ring-primary'}
                    disabled={isSubmitting}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-450 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-350"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-6" size="lg" loading={isSubmitting}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
              <p className="text-xs text-slate-450 dark:text-slate-500">
                Authorized access only. Logins and operations are audited.
              </p>
              <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-650 flex justify-center gap-2">
                <span>Manager: manager@example.com / Password123</span>
                <span>•</span>
                <span>Employee: employee1@example.com / Password123</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
