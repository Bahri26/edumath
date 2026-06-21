import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import FadeIn from '../components/ui/FadeIn';
import { useToast } from '../context/ToastContext';
import FormField from '../components/ui/FormField.jsx';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';

const Contact = ({ t }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast?.(t.contact.formSuccess, 'success', 3500);
    setForm({ fullName: '', email: '', subject: '', message: '' });
  };

  const onChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <section id="contact" className="py-24 bg-white dark:bg-surface-900 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-brand-50 dark:bg-brand-900/10 rounded-full blur-3xl opacity-50 -ml-48" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              {t.contact.title} <span className="text-brand-600 dark:text-brand-400">{t.contact.titleHighlight}</span>
            </h2>
            <p className="text-xl text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
              {t.contact.desc}
            </p>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <FadeIn delay={200} direction="right">
            <div className="space-y-8">
              <div className="bg-surface-50 dark:bg-surface-800 p-8 rounded-2xl border border-surface-100 dark:border-surface-700">
                <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-6">{t.contact.infoTitle}</h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-brand-100 dark:bg-brand-900/50 p-3 rounded-xl text-brand-600 dark:text-brand-400">
                      <MapPin size={24} aria-hidden />
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white">{t.contact.addressLabel}</h4>
                      <p className="text-surface-600 dark:text-surface-300 mt-1">{t.contact.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-brand-100 dark:bg-brand-900/50 p-3 rounded-xl text-brand-600 dark:text-brand-400">
                      <Phone size={24} aria-hidden />
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white">{t.contact.phoneLabel}</h4>
                      <p className="text-surface-600 dark:text-surface-300 mt-1">{t.contact.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-brand-100 dark:bg-brand-900/50 p-3 rounded-xl text-brand-600 dark:text-brand-400">
                      <Mail size={24} aria-hidden />
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white">{t.contact.emailLabel}</h4>
                      <p className="text-surface-600 dark:text-surface-300 mt-1">{t.contact.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-surface-200 dark:border-surface-700">
                  <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">{t.contact.socialHint}</p>
                  <a
                    href={`mailto:${t.contact.email}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 transition-colors min-h-[44px]"
                  >
                    <Mail size={18} aria-hidden />
                    {t.contact.emailUs}
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={300} direction="left">
            <div className="bg-white dark:bg-surface-800 p-8 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField label={t.contact.formName} required>
                    <Input
                      name="fullName"
                      value={form.fullName}
                      onChange={onChange('fullName')}
                      required
                      autoComplete="name"
                    />
                  </FormField>
                  <FormField label={t.contact.formEmail} required>
                    <Input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChange('email')}
                      required
                      autoComplete="email"
                    />
                  </FormField>
                </div>

                <FormField label={t.contact.formSubject} required>
                  <Input name="subject" value={form.subject} onChange={onChange('subject')} required />
                </FormField>

                <FormField label={t.contact.formMessage} required>
                  <Textarea
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={onChange('message')}
                    required
                    className="resize-y min-h-[8rem]"
                  />
                </FormField>

                <button
                  type="submit"
                  className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200/50 dark:shadow-none flex items-center justify-center gap-2"
                >
                  <Send size={18} aria-hidden />
                  {t.contact.btnSend}
                </button>
              </form>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Contact;
