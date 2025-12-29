import React from 'react';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import FadeIn from '../components/ui/FadeIn';

const Contact = ({ t }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Mesajınız başarıyla gönderildi! En kısa sürede dönüş yapacağız.");
    e.target.reset();
  };

  return (
    <section id="contact" className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 -ml-48"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t.contact.title} <span className="text-indigo-600 dark:text-indigo-400">{t.contact.titleHighlight}</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t.contact.desc}
            </p>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* İletişim Bilgileri */}
          <FadeIn delay={200} direction="right">
            <div className="space-y-8">
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t.contact.infoTitle}</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Adres</h4>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{t.contact.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Telefon</h4>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{t.contact.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">E-posta</h4>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{t.contact.email}</p>
                    </div>
                  </div>
                </div>

                {/* Sosyal Medya */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-4">
                    <a href="#" className="bg-white dark:bg-gray-700 p-3 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors border border-gray-200 dark:border-gray-600">
                      <Facebook size={20} />
                    </a>
                    <a href="#" className="bg-white dark:bg-gray-700 p-3 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors border border-gray-200 dark:border-gray-600">
                      <Twitter size={20} />
                    </a>
                    <a href="#" className="bg-white dark:bg-gray-700 p-3 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors border border-gray-200 dark:border-gray-600">
                      <Instagram size={20} />
                    </a>
                    <a href="#" className="bg-white dark:bg-gray-700 p-3 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors border border-gray-200 dark:border-gray-600">
                      <Linkedin size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Form Alanı */}
          <FadeIn delay={300} direction="left">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.contact.formName}</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.contact.formEmail}</label>
                    <input 
                      type="email" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.contact.formSubject}</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.contact.formMessage}</label>
                  <textarea 
                    rows="4"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                >
                  <Send size={18} />
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