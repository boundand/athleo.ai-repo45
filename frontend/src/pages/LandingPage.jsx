import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 👈 Import pour la traduction

const LandingPage = () => {
  const { t } = useTranslation();
  
  // Petit état pour la section FAQ (ouverture/fermeture)
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans">
      
      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-50 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <span className="text-3xl">🧬</span>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                ALTHEO AI
              </span>
            </div>
            
            {/* Navigation Droite */}
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors hidden sm:block">
                {t('nav_login', 'Se connecter')}
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2.5 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {t('nav_start', 'Commencer l\'essai')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-4 overflow-hidden">
        {/* Effets de fond (lueur bleue) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium text-sm">
            ✨ {t('hero_badge', 'L\'avenir du fitness est arrivé')}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            {t('hero_title_1', 'Votre corps, sculpté par')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">
              {t('hero_title_ai', 'l\'Intelligence Artificielle')}
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('hero_desc', 'Fini les programmes PDF génériques. Altheo analyse votre métabolisme, vos objectifs et votre emploi du temps pour générer une stratégie 100% sur mesure, mise à jour chaque semaine.')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/register" 
              className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-lg font-bold transition-all w-full sm:w-auto shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              {t('hero_btn_primary', 'Générer mon programme')} <span>🚀</span>
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-4 rounded-full border border-gray-700 hover:bg-gray-800 text-lg font-bold transition-all w-full sm:w-auto"
            >
              {t('hero_btn_secondary', 'Déjà membre ?')}
            </Link>
          </div>

          {/* Preuve sociale (Faux utilisateurs pour la démo) */}
          <div className="mt-12 flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800"></div>
              ))}
            </div>
            <p>{t('social_proof', 'Rejoint par +10,000 athlètes cette semaine')}</p>
          </div>
        </div>
      </section>

      {/* ================= FONCTIONNALITÉS (GRID) ================= */}
      <section className="py-24 bg-gray-900/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('features_title', 'Une technologie de pointe')}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t('features_subtitle', 'Une suite complète d\'outils pour optimiser chaque aspect de votre transformation.')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Carte 1 */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all hover:-translate-y-2 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">🤖</div>
              <h3 className="text-2xl font-bold mb-3">{t('feat_1_title', 'Coach IA Personnel')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('feat_1_desc', 'Posez n\'importe quelle question. Notre IA ajuste vos séances en temps réel si vous êtes fatigué ou blessé.')}</p>
            </div>

            {/* Carte 2 */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all hover:-translate-y-2 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-2xl font-bold mb-3">{t('feat_2_title', 'Analyses Précises')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('feat_2_desc', 'Visualisez votre progression. Charge progressive, volume, poids de corps : tout est tracé automatiquement.')}</p>
            </div>

            {/* Carte 3 */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all hover:-translate-y-2 group">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">🥗</div>
              <h3 className="text-2xl font-bold mb-3">{t('feat_3_title', 'Nutrition Flexible')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('feat_3_desc', 'Des plans repas qui s\'adaptent à ce qu\'il y a dans votre frigo, tout en respectant vos macros.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Texte Explicatif */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                {t('how_title', 'Comment ça marche ?')} <br />
                <span className="text-gray-500">{t('how_subtitle', 'Simple. Rapide. Efficace.')}</span>
              </h2>
              
              <div className="space-y-10">
                {/* Étape 1 */}
                <div className="flex gap-6 relative">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl z-10">1</div>
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-800 -z-0"></div> {/* Ligne verticale */}
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">{t('step_1_title', 'Créez votre profil')}</h3>
                    <p className="text-gray-400">{t('step_1_desc', 'Renseignez votre âge, poids, niveau (débutant/expert) et vos objectifs précis.')}</p>
                  </div>
                </div>

                {/* Étape 2 */}
                <div className="flex gap-6 relative">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xl z-10">2</div>
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-800 -z-0"></div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">{t('step_2_title', 'L\'IA génère le plan')}</h3>
                    <p className="text-gray-400">{t('step_2_desc', 'En quelques secondes, l\'algorithme construit un cycle de 4 semaines optimisé pour vous.')}</p>
                  </div>
                </div>

                {/* Étape 3 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-xl z-10">3</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">{t('step_3_title', 'Suivez et Progressez')}</h3>
                    <p className="text-gray-400">{t('step_3_desc', 'Laissez-vous guider à la salle. Notez vos perfs, l\'IA adapte la charge pour la prochaine séance.')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Illustration (Abstrait) */}
            <div className="relative h-[500px] rounded-3xl bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40 hover:opacity-60 transition-opacity duration-700"></div>
               <div className="z-10 bg-black/80 p-6 rounded-2xl backdrop-blur-md border border-white/10 max-w-xs text-center">
                  <span className="text-4xl mb-2 block">🔥</span>
                  <p className="font-bold text-lg text-white">{t('card_example_title', 'Séance Jambes')}</p>
                  <p className="text-sm text-green-400">{t('card_example_status', 'Optimisée par IA')}</p>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="py-20 bg-black border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('faq_title', 'Questions Fréquentes')}</h2>
          
          <div className="space-y-4">
            {[
              { q: "faq_q1", defaultQ: "Est-ce adapté aux débutants ?", a: "faq_a1", defaultA: "Absolument. L'IA détecte votre niveau et propose des exercices simples avec des vidéos explicatives." },
              { q: "faq_q2", defaultQ: "Puis-je l'utiliser à la maison ?", a: "faq_a2", defaultA: "Oui, vous pouvez spécifier 'Entraînement maison' et l'IA s'adaptera à votre matériel (ou poids du corps)." },
              { q: "faq_q3", defaultQ: "Comment fonctionne l'essai ?", a: "faq_a3", defaultA: "L'accès est gratuit pour générer votre premier programme. Aucune carte bancaire requise au départ." }
            ].map((item, idx) => (
              <div key={idx} className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium">{t(item.q, item.defaultQ)}</span>
                  <span className={`transform transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === idx && (
                  <div className="p-6 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5 mt-2">
                    {t(item.a, item.defaultA)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="py-20 text-center px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-[3rem] p-12 border border-white/10 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('cta_title', 'Prêt à transformer votre physique ?')}</h2>
            <p className="text-xl text-gray-300 mb-8">{t('cta_subtitle', 'Rejoignez Altheo aujourd\'hui et laissez l\'IA guider chaque répétition.')}</p>
            <Link 
              to="/register" 
              className="inline-block px-10 py-5 rounded-full bg-white text-black font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              {t('cta_btn', 'Commencer Gratuitement')}
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 py-12 bg-black text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="text-white font-bold mb-4">Altheo AI</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400 transition-colors">À propos</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Carrières</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Produit</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Témoignages</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Légal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">CGU</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Social</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">TikTok</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center pt-8 border-t border-white/5">
          <p>&copy; 2026 Altheo AI. {t('footer_rights', 'Tous droits réservés.')}</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
