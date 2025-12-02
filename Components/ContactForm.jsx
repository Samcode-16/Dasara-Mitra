import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from './DasaraContext.jsx';

const INITIAL_FORM = {
  name: '',
  email: '',
  message: ''
};

export default function ContactForm() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const emailEnabled = Boolean(serviceId && templateId && publicKey);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName || !emailPattern.test(trimmedEmail) || trimmedMessage.length < 5) {
      setStatus({ type: 'error', message: t('contactFormValidationError') });
      return;
    }

    if (!emailEnabled) {
      setStatus({ type: 'error', message: t('contactFormSettingsError') });
      return;
    }

    setIsSubmitting(true);
    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: trimmedName,
          reply_to: trimmedEmail,
          email: trimmedEmail,
          message: trimmedMessage
        },
        publicKey
      );

      setStatus({ type: 'success', message: t('contactFormSuccess') });
      resetForm();
    } catch (error) {
      console.error('EmailJS send error', error);
      setStatus({ type: 'error', message: t('contactFormError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#22040E]/60 p-5 shadow-inner shadow-black/20">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#FACC15]">
          {t('contactFormTitle')}
        </p>
        <p className="text-xs text-slate-100/80">{t('contactFormDescription')}</p>
        {!emailEnabled && (
          <p className="rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
            {t('contactFormSettingsError')}
          </p>
        )}
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wide text-[#FDE68A]/80">
            {t('contactFormNameLabel')}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FACC15] focus:outline-none"
            placeholder={t('contactFormNameLabel')}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-wide text-[#FDE68A]/80">
            {t('contactFormEmailLabel')}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FACC15] focus:outline-none"
            placeholder="email@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wide text-[#FDE68A]/80">
            {t('contactFormMessageLabel')}
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows="3"
            value={formData.message}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FACC15] focus:outline-none"
            placeholder={t('contactFormMessageLabel')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FACC15] to-[#F97316] px-3 py-2 text-sm font-semibold uppercase tracking-wide text-[#22040E] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('contactFormSendingLabel')}
            </>
          ) : (
            t('contactFormSubmitLabel')
          )}
        </button>
      </form>

      {status && (
        <p
          className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
            status.type === 'success'
              ? 'border border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
              : 'border border-rose-300/40 bg-rose-400/10 text-rose-100'
          }`}
          role="status"
          aria-live="polite"
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4" />
          )}
          <span>{status.message}</span>
        </p>
      )}
    </section>
  );
}
