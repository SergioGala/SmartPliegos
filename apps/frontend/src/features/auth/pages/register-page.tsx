// 📍 DESTINO: apps/frontend/src/features/auth/pages/register-page.tsx  (REEMPLAZAR ENTERO)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation, Trans } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { Mail } from 'lucide-react';

import { AuthLayout } from '../components/auth-layout';
import { GoogleButton } from '../components/google-button';
import { authApi } from '../api/auth.api';
import { registerSchema, type RegisterFormData } from '../schemas/auth.schemas';
import { cn } from '@/lib/utils';

const inputCls = (hasError?: boolean) =>
  cn(
    'h-11 w-full rounded-xl border bg-card px-3.5 text-sm text-foreground outline-none transition-colors',
    'placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
    hasError
      ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
      : 'border-border',
  );

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false } as unknown as Partial<RegisterFormData>,
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await authApi.signup({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        timezone,
      });

      setEmailSentTo(data.email);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error(t('register.errors.emailTaken'));
        } else if (error.response?.status === 429) {
          toast.error(t('register.errors.rateLimit'));
        } else {
          toast.error(t('register.errors.generic'));
        }
      } else {
        toast.error(t('common:errors.network', ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = authApi.getGoogleOAuthUrl();
  };

  // ── Estado: email enviado ──
  if (emailSentTo) {
    return (
      <AuthLayout
        title={t('register.emailSent.title')}
        subtitle={t('register.emailSent.subtitle', { email: emailSentTo })}
      >
        <div className="space-y-4 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Mail size={24} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{t('register.emailSent.body')}</p>
          <p className="text-xs text-muted-foreground">
            {t('register.emailSent.notFound')}{' '}
            <button
              onClick={() => setEmailSentTo(null)}
              className="text-primary hover:underline"
            >
              {t('register.emailSent.useAnotherEmail')}
            </button>
            .
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <span className="text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('register.login')}
          </Link>
        </span>
      }
    >
      <GoogleButton onClick={handleGoogleSignup} label={t('register.googleButton')} />

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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium">
              {t('register.firstNameLabel')}
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              autoFocus
              {...register('firstName')}
              className={inputCls(!!errors.firstName)}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium">
              {t('register.lastNameLabel')}
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              {...register('lastName')}
              className={inputCls(!!errors.lastName)}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            {t('register.emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@empresa.es"
            {...register('email')}
            className={inputCls(!!errors.email)}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
            {t('register.phoneLabel')}{' '}
            <span className="text-muted-foreground">{t('register.phoneOptional')}</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+34 612 345 678"
            {...register('phone')}
            className={inputCls(false)}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            {...register('acceptTerms')}
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            <Trans
              i18nKey="auth:register.acceptTerms"
              components={{
                termsLink: (
                  <Link
                    to="/legal/terms"
                    target="_blank"
                    className="text-foreground hover:underline"
                  />
                ),
                privacyLink: (
                  <Link
                    to="/legal/privacy"
                    target="_blank"
                    className="text-foreground hover:underline"
                  />
                ),
              }}
            />
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t('register.submittingButton') : t('register.submitButton')}
        </button>
      </form>
    </AuthLayout>
  );
}