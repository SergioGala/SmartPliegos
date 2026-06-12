// 📍 DESTINO: apps/frontend/src/features/auth/pages/login-page.tsx  (REEMPLAZAR ENTERO)
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';

import { AuthLayout } from '../components/auth-layout';
import { PasswordInput } from '../components/password-input';
import { GoogleButton } from '../components/google-button';
import { authApi } from '../api/auth.api';
import { loginSchema, type LoginFormData } from '../schemas/auth.schemas';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const inputCls = (hasError?: boolean) =>
  cn(
    'h-11 w-full rounded-xl border bg-card px-3.5 text-sm text-foreground outline-none transition-colors',
    'placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
    hasError
      ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
      : 'border-border',
  );

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login(data);

      useAuthStore.getState().setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      useAuthStore.getState().setUser(response.user);
      useAuthStore.getState().setStatus('authenticated');

      toast.success(t('login.success'));
      const redirectTo = searchParams.get('redirect') || '/app';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error(t('login.errors.invalidCredentials'));
        } else if (error.response?.status === 429) {
          toast.error(t('login.errors.rateLimit'));
        } else {
          toast.error(t('login.errors.generic'));
        }
      } else {
        toast.error(t('common:errors.network', ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authApi.getGoogleOAuthUrl();
  };

  return (
    <AuthLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <span className="text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t('login.createAccount')}
          </Link>
        </span>
      }
    >
      <GoogleButton onClick={handleGoogleLogin} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 font-mono text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground/60">
            {t('divider.email', { defaultValue: 'o con tu email' })}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            {t('login.emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="tu@empresa.es"
            {...register('email')}
            className={inputCls(!!errors.email)}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium">
              {t('login.passwordLabel')}
            </label>
            <Link
              to="/reset-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t('login.submittingButton') : t('login.submitButton')}
        </button>
      </form>
    </AuthLayout>
  );
}