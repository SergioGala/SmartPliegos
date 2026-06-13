// 📍 DESTINO: apps/frontend/src/features/landing/pages/landing-page.tsx  (REEMPLAZAR ENTERO)
//
// Landing recableada a i18n (namespace 'landing'). El switcher de idioma ahora
// SÍ cambia el copy. Se preservan TODOS los efectos (useLandingEffects, refs,
// data-count, data-mag, reveal, ids heroField/heroSpot/heroScan…), SVGs, clases
// y los mockups decorativos (navegador/email/PDF), que se dejan en español como
// "captura de producto". El marquee de sectores se deja fijo para no romper su
// animación. Las claves nuevas viven en locales/<lang>/landing.json.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation, Trans } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLandingEffects } from '../use-landing-effects';
import '../landing.css';

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const LogoMark = () => (
  <svg className="logo-mark" viewBox="0 0 30 30" fill="none" aria-hidden="true">
    <rect x="2" y="17" width="6" height="11" rx="2" fill="currentColor" />
    <rect x="12" y="10" width="6" height="18" rx="2" fill="currentColor" />
    <rect x="22" y="2" width="6" height="26" rx="2" fill="var(--lime)" />
  </svg>
);

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingEffects(rootRef);
  const { t } = useTranslation('landing');

  return (
    <>
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <meta property="og:title" content="SmartPliegos" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="lp" ref={rootRef} id="top">
        {/* ░░░ NAV ░░░ */}
        <header className="nav">
          <div className="wrap nav-inner">
            <a href="#top" className="logo" aria-label="SmartPliegos inicio" style={{ color: 'var(--lp-stage-fg)' }}>
              <LogoMark />
              <span className="logo-word">Smart<b>Pliegos</b></span>
            </a>

            <nav className="nav-links" aria-label="Principal">
              <a href="#producto" className="nav-link">{t('nav.producto')}</a>
              <a href="#ia" className="nav-link">{t('nav.ia')}</a>
              <a href="#precios" className="nav-link">{t('nav.precios')}</a>
              <a href="#contacto" className="nav-link">{t('nav.contacto')}</a>
            </nav>

            <div className="nav-right">
              <LanguageSwitcher variant="icon" />
              <Link to="/login" className="nav-login">{t('nav.login')}</Link>
              <span className="mag" data-mag="0.25">
                <Link to="/register" className="btn btn-primary btn-sm" data-hot><span>{t('nav.register')}</span></Link>
              </span>
            </div>
          </div>
        </header>

        <main>
          {/* ░░░ HERO ░░░ */}
          <section className="hero section is-stage" id="producto">
            <div className="hero-grid-bg" />
            <div className="hero-glow" />
            <div className="hero-field" id="heroField" aria-hidden="true" />
            <div className="hero-spot" id="heroSpot" aria-hidden="true" />
            <div className="hero-scan" id="heroScan" aria-hidden="true" />
            <div className="hero-scrim" aria-hidden="true" />
            <div className="hero-tag" aria-hidden="true">
              <span className="d" /><span>1 match · <span className="pct">98%</span> de afinidad</span>
            </div>

            <div className="wrap hero-inner">
              <div className="hero-top">
                <span className="kicker reveal"><span className="dot" />{t('hero.kicker1')}</span>
                <span className="kicker reveal reveal-d1" style={{ textAlign: 'right' }}>{t('hero.kicker2')}</span>
              </div>

              <h1 className="hero-h1 display">
                <span className="l"><span>{t('hero.title.l1')}</span></span>
                <span className="l"><span className="accent">{t('hero.title.l2')}</span></span>
                <span className="l"><span>{t('hero.title.l3')}</span></span>
                <span className="l"><span className="outline-text">{t('hero.title.l4')}</span></span>
              </h1>

              <div className="hero-bottom">
                <p className="hero-sub reveal reveal-d2">
                  <Trans i18nKey="landing:hero.sub" components={{ b: <b /> }} />
                </p>

                <div className="hero-cta-row reveal reveal-d3">
                  <div className="hero-ctas">
                    <span className="mag" data-mag="0.3">
                      <Link to="/register" className="btn btn-primary" data-hot><span>{t('hero.ctaStart')}</span><Arrow /></Link>
                    </span>
                    <span className="mag" data-mag="0.2">
                      <a href="#ia" className="btn btn-ghost"><span>{t('hero.ctaSecondary')}</span><span className="arrow"><Arrow /></span></a>
                    </span>
                  </div>
                  <div className="hero-disclaimer">
                    <span>{t('hero.disclaimer.forever')}</span><span className="sep" />
                    <span>{t('hero.disclaimer.noCard')}</span><span className="sep" />
                    <span>{t('hero.disclaimer.updated')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ░░░ MARQUEE ░░░ (decorativo, se deja fijo) */}
          <div className="marquee">
            <div className="marquee-track">
              {[0, 1].map((k) => (
                <span className="marquee-item" key={k} aria-hidden={k === 1}>
                  Obras<span className="star">✳</span>Suministros<span className="star">✳</span>Servicios<span className="star">✳</span>Sanidad<span className="star">✳</span>Tecnología<span className="star">✳</span>Energía<span className="star">✳</span>Consultoría<span className="star">✳</span>Construcción<span className="star">✳</span>
                </span>
              ))}
            </div>
          </div>

          {/* ░░░ STATS ░░░ */}
          <section className="stats section">
            <div className="stats-grid">
              <div className="stat reveal">
                <div className="stat-num"><span data-count="288000">0</span><span className="u">+</span></div>
                <div className="stat-label">{t('stats.indexed')}</div>
              </div>
              <div className="stat reveal reveal-d1">
                <div className="stat-num"><span data-count="5">0</span><span className="u">min</span></div>
                <div className="stat-label">{t('stats.frequency')}</div>
              </div>
              <div className="stat reveal reveal-d2">
                <div className="stat-num"><span data-count="15">0</span><span className="u">s</span></div>
                <div className="stat-label">{t('stats.aiSummary')}</div>
              </div>
              <div className="stat reveal reveal-d3">
                <div className="stat-num"><span data-count="19">0</span><span className="u">CCAA</span></div>
                <div className="stat-label">{t('stats.regions')}</div>
              </div>
            </div>
          </section>

          {/* ░░░ FEATURES ░░░ */}
          <section className="features section">
            <div className="wrap">
              <div className="sec-head reveal">
                <span className="sec-num">01 — 03</span>
                <div>
                  <h2 className="sec-title display">{t('features.head.title1')}<br /><span className="outline-text">{t('features.head.title2')}</span></h2>
                  <p className="sec-intro">{t('features.head.intro')}</p>
                </div>
              </div>

              {/* 01 — Búsqueda */}
              <div className="feature">
                <div className="feature-text reveal">
                  <div className="feature-idx">{t('features.search.idx')}</div>
                  <h3 className="feature-h">{t('features.search.h')}</h3>
                  <p className="feature-p">{t('features.search.p')}</p>
                  <div className="feature-list">
                    <div className="feature-li"><span className="tick">→</span> {t('features.search.b1')}</div>
                    <div className="feature-li"><span className="tick">→</span> {t('features.search.b2')}</div>
                    <div className="feature-li"><span className="tick">→</span> {t('features.search.b3')}</div>
                  </div>
                </div>
                <div className="feature-media reveal reveal-d1">
                  <div className="mock">
                    <div className="mock-bar">
                      <span className="mock-dot" /><span className="mock-dot" /><span className="mock-dot" />
                      <span className="mock-url">app.smartpliegos.es/buscar</span>
                    </div>
                    <div className="mock-body">
                      <div className="mk-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lime-deep)" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
                        <span>mantenimiento instalaciones</span><span className="cw" />
                      </div>
                      <div className="mk-chips">
                        <span className="mk-chip on">CPV 50700000</span>
                        <span className="mk-chip on">Andalucía</span>
                        <span className="mk-chip">&gt; 100.000 €</span>
                        <span className="mk-chip">Abierto</span>
                      </div>
                      <div className="mk-row"><div><div className="mk-row-t">Mantenimiento integral de climatización — Hospital U. Virgen del Rocío</div><div className="mk-row-m">SAS · Sevilla · cierra en 12 días</div></div><div className="mk-row-s">340.000 €</div></div>
                      <div className="mk-row"><div><div className="mk-row-t">Conservación de instalaciones — Ayto. de Málaga</div><div className="mk-row-m">Servicios · Málaga · cierra en 8 días</div></div><div className="mk-row-s">128.500 €</div></div>
                      <div className="mk-row"><div><div className="mk-row-t">Mantenimiento preventivo edificios públicos — Diputación</div><div className="mk-row-m">Servicios · Granada · cierra en 20 días</div></div><div className="mk-row-s">215.000 €</div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 02 — Alertas */}
              <div className="feature flip">
                <div className="feature-text reveal">
                  <div className="feature-idx">{t('features.alerts.idx')}</div>
                  <h3 className="feature-h">{t('features.alerts.h')}</h3>
                  <p className="feature-p">{t('features.alerts.p')}</p>
                  <div className="feature-list">
                    <div className="feature-li"><span className="tick">→</span> {t('features.alerts.b1')}</div>
                    <div className="feature-li"><span className="tick">→</span> {t('features.alerts.b2')}</div>
                    <div className="feature-li"><span className="tick">→</span> {t('features.alerts.b3')}</div>
                  </div>
                </div>
                <div className="feature-media reveal reveal-d1">
                  <div className="mk-mail">
                    <div className="mk-mail-h">
                      <span className="ico">SP</span>
                      <div><div className="mk-mail-sub">3 nuevas licitaciones para «Climatización · Andalucía»</div><div className="mk-mail-meta">alertas@smartpliegos.com · ahora mismo</div></div>
                    </div>
                    <div className="mk-mail-b">
                      <div className="mk-alert"><span className="badge">98%</span><div><div className="mk-alert-t">Mantenimiento integral de climatización — Hospital U. Virgen del Rocío</div><div className="mk-alert-m">340.000 € · cierra en 12 días</div></div></div>
                      <div className="mk-alert"><span className="badge">91%</span><div><div className="mk-alert-t">Renovación de enfriadoras — Universidad de Sevilla</div><div className="mk-alert-m">182.000 € · cierra en 16 días</div></div></div>
                      <div className="mk-alert"><span className="badge">87%</span><div><div className="mk-alert-t">Climatización centros educativos — Junta de Andalucía</div><div className="mk-alert-m">510.000 € · cierra en 25 días</div></div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 03 — IA */}
              <div className="feature">
                <div className="feature-text reveal">
                  <div className="feature-idx">{t('features.ai.idx')}</div>
                  <h3 className="feature-h">{t('features.ai.h')}</h3>
                  <p className="feature-p">{t('features.ai.p')}</p>
                  <div className="feature-list">
                    <div className="feature-li"><span className="tick">→</span> {t('features.ai.b1')}</div>
                    <div className="feature-li"><span className="tick">→</span> {t('features.ai.b2')}</div>
                    <div className="feature-li"><span className="tick">→</span> {t('features.ai.b3')}</div>
                  </div>
                </div>
                <div className="feature-media reveal reveal-d1">
                  <div className="ph">
                    <span className="ph-label">captura · panel de licitación con resumen IA</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ░░░ AI SHOWCASE ░░░ */}
          <section className="ai section" id="ia">
            <div className="wrap">
              <div className="sec-head reveal">
                <span className="sec-num">IA</span>
                <div>
                  <h2 className="sec-title display">{t('ai.head.title1')}<br />{t('ai.head.title2')}</h2>
                  <p className="sec-intro">{t('ai.head.intro')}</p>
                </div>
              </div>

              <div className="ai-stage">
                <div className="doc reveal">
                  <span className="doc-tag">PDF · 112 págs</span>
                  <h5>Pliego de cláusulas administrativas particulares</h5>
                  <div className="doc-ref">Expediente 2024/SUMI/0042 · procedimiento abierto</div>
                  <div className="doc-lines">
                    {['100%', '92%', '97%', '78%', '100%', '88%', '95%', '60%', '100%', '84%', '90%', '72%'].map((w, i) => (
                      <i key={i} style={{ width: w }} />
                    ))}
                  </div>
                  <div className="doc-pages">…y 109 páginas más de cláusulas</div>
                </div>

                <div className="ai-arrow reveal reveal-d1">
                  <span className="t">SmartPliegos IA</span>
                  <span className="a">→</span>
                </div>

                <div className="summary reveal reveal-d2">
                  <div className="summary-h"><span className="ai-chip">Resumen IA</span><span className="t">generado en 14s</span></div>
                  <div className="summary-row"><span className="k">Objeto</span><span className="v">Suministro e instalación de equipos de climatización para 6 centros de salud.</span></div>
                  <div className="summary-row"><span className="k">Importe</span><span className="v"><b>340.000 €</b> · IVA excluido</span></div>
                  <div className="summary-row"><span className="k">Plazo</span><span className="v">Presentación hasta el <b>30 jun 2026</b> · ejecución 8 meses</span></div>
                  <div className="summary-row"><span className="k">Solvencia</span><span className="v">Volumen anual ≥ 510.000 € · 2 contratos similares en 3 años</span></div>
                  <div className="summary-row"><span className="k">Criterios</span><span className="v">Precio 60% · Mejoras técnicas 25% · Plazo 15%</span></div>
                </div>
              </div>
            </div>
          </section>

          {/* ░░░ PRICING ░░░ */}
          <section className="pricing section" id="precios">
            <div className="wrap">
              <div className="sec-head reveal">
                <span className="sec-num">$</span>
                <div>
                  <h2 className="sec-title display">{t('pricing.head.title1')}<br /><span className="outline-text">{t('pricing.head.title2')}</span></h2>
                  <p className="sec-intro">{t('pricing.head.intro')}</p>
                </div>
              </div>

              <div className="price-grid">
                {/* Free */}
                <div className="price-card reveal">
                  <div className="price-top"><span className="price-name">{t('pricing.free.name')}</span></div>
                  <p className="price-desc">{t('pricing.free.desc')}</p>
                  <div className="price-val"><span className="price-amount">0€</span><span className="price-cad">{t('pricing.free.cadence')}</span></div>
                  <div className="price-rule" />
                  <div className="price-feats">
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.free.f1')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.free.f2')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.free.f3')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.free.f4')}</div>
                  </div>
                  <Link to="/register" className="price-cta">{t('pricing.free.cta')}</Link>
                </div>

                {/* Pro */}
                <div className="price-card feat reveal reveal-d1">
                  <div className="price-top"><span className="price-name">{t('pricing.pro.name')}</span><span className="price-pop">{t('pricing.pro.pop')}</span></div>
                  <p className="price-desc">{t('pricing.pro.desc')}</p>
                  <div className="price-val"><span className="price-amount">50€</span><span className="price-cad">{t('pricing.pro.cadence')}</span></div>
                  <div className="price-rule" />
                  <div className="price-feats">
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.pro.f1')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.pro.f2')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.pro.f3')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.pro.f4')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.pro.f5')}</div>
                  </div>
                  <Link to="/register" className="price-cta" data-hot>{t('pricing.pro.cta')}</Link>
                </div>

                {/* Créditos IA */}
                <div className="price-card reveal reveal-d2">
                  <div className="price-top"><span className="price-name">{t('pricing.credits.name')}</span></div>
                  <p className="price-desc">{t('pricing.credits.desc')}</p>
                  <div className="price-val"><span className="price-amount">5€</span><span className="price-cad">{t('pricing.credits.cadence')}</span></div>
                  <div className="price-rule" />
                  <div className="price-feats">
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.credits.f1')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.credits.f2')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.credits.f3')}</div>
                    <div className="price-feat"><span className="tick">✓</span> {t('pricing.credits.f4')}</div>
                  </div>
                  <Link to="/register" className="price-cta">{t('pricing.credits.cta')}</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ░░░ FINAL CTA ░░░ */}
          <section className="final section is-stage" id="contacto">
            <div className="final-glow" />
            <div className="wrap final-inner">
              <span className="kicker reveal" style={{ justifyContent: 'center' }}><span className="dot" />{t('final.kicker')}</span>
              <h2 className="display reveal reveal-d1" style={{ marginTop: '1.4rem' }}>{t('final.titleL1')}<br />{t('final.titlePre')} <span className="accent">{t('final.titleAccent')}</span> {t('final.titlePost')}</h2>
              <p className="final-sub reveal reveal-d2">{t('final.sub')}</p>
              <div className="reveal reveal-d3" style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <span className="mag" data-mag="0.3">
                  <Link to="/register" className="btn btn-primary" data-hot><span>{t('final.ctaStart')}</span><Arrow /></Link>
                </span>
                <a href="mailto:ventas@smartpliegos.com" className="btn btn-ghost"><span>{t('final.ctaSales')}</span></a>
              </div>
            </div>
          </section>
        </main>

        {/* ░░░ FOOTER ░░░ */}
        <footer className="footer section is-stage">
          <div className="wrap">
            <div className="footer-top">
              <div className="footer-brand">
                <a href="#top" className="logo" style={{ color: 'var(--lp-stage-fg)' }}>
                  <LogoMark />
                  <span className="logo-word">Smart<b>Pliegos</b></span>
                </a>
                <p className="footer-tag">{t('footer.tag')}</p>
              </div>
              <div className="footer-col">
                <h6>{t('footer.product.title')}</h6>
                <a href="#producto">{t('footer.product.search')}</a>
                <a href="#producto">{t('footer.product.alerts')}</a>
                <a href="#ia">{t('footer.product.ai')}</a>
                <a href="#precios">{t('footer.product.pricing')}</a>
              </div>
              <div className="footer-col">
                <h6>{t('footer.company.title')}</h6>
                <a href="#">{t('footer.company.about')}</a>
                <a href="#contacto">{t('footer.company.contact')}</a>
                <a href="#">{t('footer.company.blog')}</a>
              </div>
              <div className="footer-col">
                <h6>{t('footer.legal.title')}</h6>
                <Link to="/legal/terms">{t('footer.legal.terms')}</Link>
                <Link to="/legal/privacy">{t('footer.legal.privacy')}</Link>
                <Link to="/legal/cookies">{t('footer.legal.cookies')}</Link>
              </div>
            </div>

            <div className="footer-word" aria-hidden="true">SmartPliegos</div>

            <div className="footer-bottom">
              <span className="footer-copy">{t('footer.copyright', { year: new Date().getFullYear() })}</span>
              <div className="footer-legal">
                <Link to="/legal/terms">{t('footer.legal.terms')}</Link>
                <Link to="/legal/privacy">{t('footer.legal.privacy')}</Link>
                <a href="mailto:hola@smartpliegos.com">hola@smartpliegos.com</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}