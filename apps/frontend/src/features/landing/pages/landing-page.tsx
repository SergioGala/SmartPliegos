import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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

  return (
    <>
      <Helmet>
        <title>SmartPliegos · Inteligencia en licitaciones públicas</title>
        <meta
          name="description"
          content="Búsqueda inteligente sobre 288.000 licitaciones de PLACE, alertas en tiempo real y resúmenes con IA de pliegos de 100+ páginas en segundos."
        />
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
              <a href="#producto" className="nav-link">Producto</a>
              <a href="#ia" className="nav-link">IA</a>
              <a href="#precios" className="nav-link">Precios</a>
              <a href="#contacto" className="nav-link">Contacto</a>
            </nav>

            <div className="nav-right">
              <LanguageSwitcher variant="icon" />
              <Link to="/login" className="nav-login">Iniciar sesión</Link>
              <span className="mag" data-mag="0.25">
                <Link to="/register" className="btn btn-primary btn-sm" data-hot><span>Empezar gratis</span></Link>
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
                <span className="kicker reveal"><span className="dot" />Inteligencia en contratación pública · España</span>
                <span className="kicker reveal reveal-d1" style={{ textAlign: 'right' }}>PLACE · 288.000+ licitaciones · datos oficiales</span>
              </div>

              <h1 className="hero-h1 display">
                <span className="l"><span>Gana más</span></span>
                <span className="l"><span className="accent">licitaciones</span></span>
                <span className="l"><span>públicas.</span></span>
                <span className="l"><span className="outline-text">Pierde menos tiempo.</span></span>
              </h1>

              <div className="hero-bottom">
                <p className="hero-sub reveal reveal-d2">
                  Búsqueda inteligente, <b>alertas a medida</b> en tiempo real y resúmenes con <b>IA</b> de pliegos de 100+ páginas en <b>15 segundos</b>. Todo sobre la Plataforma de Contratación del Sector Público.
                </p>

                <div className="hero-cta-row reveal reveal-d3">
                  <div className="hero-ctas">
                    <span className="mag" data-mag="0.3">
                      <Link to="/register" className="btn btn-primary" data-hot><span>Empezar gratis</span><Arrow /></Link>
                    </span>
                    <span className="mag" data-mag="0.2">
                      <a href="#ia" className="btn btn-ghost"><span>Ver cómo funciona</span><span className="arrow"><Arrow /></span></a>
                    </span>
                  </div>
                  <div className="hero-disclaimer">
                    <span>Gratis para siempre</span><span className="sep" />
                    <span>Sin tarjeta</span><span className="sep" />
                    <span>Actualizado cada 5 min</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ░░░ MARQUEE ░░░ */}
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
                <div className="stat-label">Licitaciones indexadas</div>
              </div>
              <div className="stat reveal reveal-d1">
                <div className="stat-num"><span data-count="5">0</span><span className="u">min</span></div>
                <div className="stat-label">Frecuencia de actualización</div>
              </div>
              <div className="stat reveal reveal-d2">
                <div className="stat-num"><span data-count="15">0</span><span className="u">s</span></div>
                <div className="stat-label">Resumen IA de un pliego</div>
              </div>
              <div className="stat reveal reveal-d3">
                <div className="stat-num"><span data-count="19">0</span><span className="u">CCAA</span></div>
                <div className="stat-label">Comunidades cubiertas</div>
              </div>
            </div>
          </section>

          {/* ░░░ FEATURES ░░░ */}
          <section className="features section">
            <div className="wrap">
              <div className="sec-head reveal">
                <span className="sec-num">01 — 03</span>
                <div>
                  <h2 className="sec-title display">Todo lo que necesitas.<br /><span className="outline-text">Nada de lo que no.</span></h2>
                  <p className="sec-intro">Herramientas pensadas para empresas que se juegan contratos de verdad. Sin ruido, sin paneles inútiles, sin curva de aprendizaje.</p>
                </div>
              </div>

              {/* 01 — Búsqueda */}
              <div className="feature">
                <div className="feature-text reveal">
                  <div className="feature-idx">/ 01 — Búsqueda inteligente</div>
                  <h3 className="feature-h">Encuentra tu próximo contrato entre 288.000.</h3>
                  <p className="feature-p">Filtra 288.000 licitaciones de PLACE por CPV, comunidad, órgano de contratación, importe y estado. Resultados al instante, relevancia real.</p>
                  <div className="feature-list">
                    <div className="feature-li"><span className="tick">→</span> Filtros por CPV, CCAA, órgano e importe combinables</div>
                    <div className="feature-li"><span className="tick">→</span> Búsqueda semántica que entiende lo que buscas</div>
                    <div className="feature-li"><span className="tick">→</span> Guarda búsquedas y conviértelas en alertas</div>
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
                  <div className="feature-idx">/ 02 — Alertas a medida</div>
                  <h3 className="feature-h">Que las licitaciones te busquen a ti.</h3>
                  <p className="feature-p">Define tus criterios una vez y recibe un email en el momento exacto en que aparece una licitación que encaja. Sin revisar portales cada mañana.</p>
                  <div className="feature-list">
                    <div className="feature-li"><span className="tick">→</span> Alertas con criterios combinados</div>
                    <div className="feature-li"><span className="tick">→</span> Notificación en tiempo real, no resúmenes diarios</div>
                    <div className="feature-li"><span className="tick">→</span> Puntuación de afinidad en cada match</div>
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

              {/* 03 — IA (placeholder de captura) */}
              <div className="feature">
                <div className="feature-text reveal">
                  <div className="feature-idx">/ 03 — Lectura con IA</div>
                  <h3 className="feature-h">100 páginas de pliego, leídas en 15 segundos.</h3>
                  <p className="feature-p">Sube un pliego y recibe un resumen estructurado: objeto, importe, plazos, criterios de adjudicación y requisitos de solvencia. Decide si presentarte en un minuto, no en una tarde.</p>
                  <div className="feature-list">
                    <div className="feature-li"><span className="tick">→</span> Objeto, importe y plazos extraídos automáticamente</div>
                    <div className="feature-li"><span className="tick">→</span> Criterios de adjudicación y solvencia destacados</div>
                    <div className="feature-li"><span className="tick">→</span> Pregúntale al pliego en lenguaje natural</div>
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
                  <h2 className="sec-title display">Del pliego ilegible<br />al resumen accionable.</h2>
                  <p className="sec-intro">Los pliegos administrativos no están hechos para leerse rápido. La IA de SmartPliegos los digiere por ti y te da solo lo que importa para decidir.</p>
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
                  <h2 className="sec-title display">Precios simples.<br /><span className="outline-text">Cambia cuando quieras.</span></h2>
                  <p className="sec-intro">Empieza gratis, sin tarjeta. Sube a Pro cuando lo necesites y recarga créditos de IA a la carta.</p>
                </div>
              </div>

              <div className="price-grid">
                {/* Free */}
                <div className="price-card reveal">
                  <div className="price-top"><span className="price-name">Free</span></div>
                  <p className="price-desc">Para probarlo. Sin tarjeta.</p>
                  <div className="price-val"><span className="price-amount">0€</span><span className="price-cad">para siempre</span></div>
                  <div className="price-rule" />
                  <div className="price-feats">
                    <div className="price-feat"><span className="tick">✓</span> Buscador completo</div>
                    <div className="price-feat"><span className="tick">✓</span> 1 alerta activa</div>
                    <div className="price-feat"><span className="tick">✓</span> 5 resúmenes IA / mes</div>
                    <div className="price-feat"><span className="tick">✓</span> Soporte por email</div>
                  </div>
                  <Link to="/register" className="price-cta">Empezar gratis</Link>
                </div>

                {/* Pro */}
                <div className="price-card feat reveal reveal-d1">
                  <div className="price-top"><span className="price-name">Pro</span><span className="price-pop">Más popular</span></div>
                  <p className="price-desc">Para empresas que van en serio.</p>
                  <div className="price-val"><span className="price-amount">50€</span><span className="price-cad">/ mes</span></div>
                  <div className="price-rule" />
                  <div className="price-feats">
                    <div className="price-feat"><span className="tick">✓</span> Todo lo de Free</div>
                    <div className="price-feat"><span className="tick">✓</span> Alertas ilimitadas</div>
                    <div className="price-feat"><span className="tick">✓</span> 100 resúmenes IA / mes</div>
                    <div className="price-feat"><span className="tick">✓</span> Exportación a Excel / CSV</div>
                    <div className="price-feat"><span className="tick">✓</span> Soporte prioritario</div>
                  </div>
                  <Link to="/register" className="price-cta" data-hot>Empezar prueba de 14 días</Link>
                </div>

                {/* Créditos IA */}
                <div className="price-card reveal reveal-d2">
                  <div className="price-top"><span className="price-name">Créditos IA</span></div>
                  <p className="price-desc">¿Se te acaban los del plan? Recarga cuando quieras.</p>
                  <div className="price-val"><span className="price-amount">5€</span><span className="price-cad">/ 100 créditos</span></div>
                  <div className="price-rule" />
                  <div className="price-feats">
                    <div className="price-feat"><span className="tick">✓</span> Packs de créditos IA a la carta</div>
                    <div className="price-feat"><span className="tick">✓</span> Se suman a los de tu plan</div>
                    <div className="price-feat"><span className="tick">✓</span> Sin caducidad mensual</div>
                    <div className="price-feat"><span className="tick">✓</span> Pago único, sin suscripción</div>
                  </div>
                  <Link to="/register" className="price-cta">Comprar créditos</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ░░░ FINAL CTA ░░░ */}
          <section className="final section is-stage" id="contacto">
            <div className="final-glow" />
            <div className="wrap final-inner">
              <span className="kicker reveal" style={{ justifyContent: 'center' }}><span className="dot" />Crea tu cuenta en 30 segundos</span>
              <h2 className="display reveal reveal-d1" style={{ marginTop: '1.4rem' }}>¿Listo para dejar<br />de <span className="accent">perder</span> licitaciones?</h2>
              <p className="final-sub reveal reveal-d2">Sin tarjeta. Sin compromiso. Datos oficiales de PLACE actualizados cada 5 minutos.</p>
              <div className="reveal reveal-d3" style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <span className="mag" data-mag="0.3">
                  <Link to="/register" className="btn btn-primary" data-hot><span>Empezar gratis</span><Arrow /></Link>
                </span>
                <a href="mailto:ventas@smartpliegos.com" className="btn btn-ghost"><span>Hablar con ventas</span></a>
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
                <p className="footer-tag">Inteligencia en licitaciones públicas. Sobre datos oficiales de la Plataforma de Contratación del Sector Público.</p>
              </div>
              <div className="footer-col">
                <h6>Producto</h6>
                <a href="#producto">Búsqueda</a>
                <a href="#producto">Alertas</a>
                <a href="#ia">Resúmenes IA</a>
                <a href="#precios">Precios</a>
              </div>
              <div className="footer-col">
                <h6>Empresa</h6>
                <a href="#">Sobre nosotros</a>
                <a href="#contacto">Contacto</a>
                <a href="#">Blog</a>
              </div>
              <div className="footer-col">
                <h6>Legal</h6>
                <Link to="/legal/terms">Términos</Link>
                <Link to="/legal/privacy">Privacidad</Link>
                <Link to="/legal/cookies">Cookies</Link>
              </div>
            </div>

            <div className="footer-word" aria-hidden="true">SmartPliegos</div>

            <div className="footer-bottom">
              <span className="footer-copy">© <span id="lp-year">2026</span> SmartPliegos. Todos los derechos reservados.</span>
              <div className="footer-legal">
                <Link to="/legal/terms">Términos</Link>
                <Link to="/legal/privacy">Privacidad</Link>
                <a href="mailto:hola@smartpliegos.com">hola@smartpliegos.com</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
