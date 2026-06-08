import { useEffect } from 'react';

/**
 * Motion de la landing — port de landing.js a React.
 * Reveals, contadores, botones magnéticos, parallax, nav-scrolled y el
 * campo de datos + scanner del hero. SIN cursor. Scopeado al root, con
 * cleanup y resistente a doble-montaje de React StrictMode.
 */
export function useLandingEffects(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer:fine)').matches;
    const cleanups: Array<() => void> = [];
    const rafs: number[] = [];
    const timeouts: number[] = [];

    root.classList.add('is-js');

    /* ---------- NAV scrolled ---------- */
    const nav = root.querySelector('.nav');
    const onScrollNav = () => {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScrollNav();
    window.addEventListener('scroll', onScrollNav, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScrollNav));

    /* ---------- Contadores ---------- */
    const group = (n: string) => {
      const parts = String(n).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.join(',');
    };
    const runCount = (el: HTMLElement) => {
      const target = parseFloat(el.dataset.count || '0');
      const dec = parseInt(el.dataset.dec || '0', 10);
      const suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = group(target.toFixed(dec)) + suffix; return; }
      const dur = 1500;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = group((target * eased).toFixed(dec)) + suffix;
        if (p < 1) rafs.push(requestAnimationFrame(tick));
        else el.textContent = group(target.toFixed(dec)) + suffix;
      };
      rafs.push(requestAnimationFrame(tick));
    };

    /* ---------- Reveal ---------- */
    let revealEls = Array.from(root.querySelectorAll<HTMLElement>('.reveal, .line-mask, [data-count]'));
    const activate = (el: HTMLElement) => {
      if (el.classList.contains('in')) return;
      el.classList.add('in');
      if (el.dataset.count !== undefined) runCount(el);
    };
    const checkReveals = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const remaining: HTMLElement[] = [];
      for (const el of revealEls) {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) activate(el);
        else remaining.push(el);
      }
      revealEls = remaining;
    };
    let ticking = false;
    const requestCheck = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; checkReveals(); });
    };
    window.addEventListener('scroll', requestCheck, { passive: true });
    window.addEventListener('resize', requestCheck, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', requestCheck));
    cleanups.push(() => window.removeEventListener('resize', requestCheck));
    checkReveals();
    timeouts.push(window.setTimeout(checkReveals, 700));
    timeouts.push(window.setTimeout(() => {
      root.querySelectorAll<HTMLElement>('.reveal:not(.in), .line-mask:not(.in), [data-count]:not(.in)').forEach(activate);
    }, 2500));

    /* ---------- Hero line stagger ---------- */
    if (!reduced) {
      root.querySelectorAll<HTMLElement>('.hero-h1 .l > span').forEach((s, i) => {
        s.style.transition = 'transform 1.1s cubic-bezier(0.22,1,0.36,1)';
        s.style.transform = 'translateY(105%)';
        timeouts.push(window.setTimeout(() => { s.style.transform = 'translateY(0)'; }, 120 + i * 110));
      });
    }

    /* ---------- Magnetic buttons ---------- */
    if (!reduced && finePointer) {
      root.querySelectorAll<HTMLElement>('.mag').forEach((m) => {
        const strength = parseFloat(m.dataset.mag || '0.3');
        const move = (e: MouseEvent) => {
          const r = m.getBoundingClientRect();
          m.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * strength}px,${(e.clientY - (r.top + r.height / 2)) * strength}px)`;
        };
        const leave = () => { m.style.transform = 'translate(0,0)'; };
        m.addEventListener('mousemove', move);
        m.addEventListener('mouseleave', leave);
        cleanups.push(() => { m.removeEventListener('mousemove', move); m.removeEventListener('mouseleave', leave); });
      });
    }

    /* ---------- Parallax glow ---------- */
    const glow = root.querySelector<HTMLElement>('.hero-glow');
    if (!reduced && glow) {
      const onScrollGlow = () => { glow.style.transform = `translateX(-50%) translateY(${window.scrollY * 0.25}px)`; };
      window.addEventListener('scroll', onScrollGlow, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', onScrollGlow));
    }

    /* ---------- Año ---------- */
    const yr = root.querySelector('#lp-year');
    if (yr) yr.textContent = String(new Date().getFullYear());

    /* ============================================================
       HERO — campo de datos + scanner
       Construcción idempotente + animación SIEMPRE reenganchada
       (sobrevive al doble-montaje de StrictMode).
       ============================================================ */
    const field = root.querySelector<HTMLElement>('#heroField');
    const scan = root.querySelector<HTMLElement>('#heroScan');
    const spot = root.querySelector<HTMLElement>('#heroSpot');

    if (field) {
      // 1) Construir filas SOLO si está vacío
      if (field.childElementCount === 0) {
        const OBJETOS = [
          'Mantenimiento de zonas verdes y arbolado urbano',
          'Suministro de equipos informáticos y licencias',
          'Servicio de limpieza de edificios municipales',
          'Obras de reurbanización de la plaza mayor',
          'Redacción de proyecto de eficiencia energética',
          'Conservación de carreteras de la red autonómica',
          'Servicio de vigilancia y seguridad privada',
          'Suministro de material sanitario fungible',
          'Mantenimiento de instalaciones de alumbrado',
          'Gestión del servicio de transporte escolar',
          'Adquisición de vehículos para servicios técnicos',
          'Servicio de comedor en centros educativos',
          'Renovación de la red de abastecimiento de agua',
          'Asistencia técnica para dirección de obra',
          'Suministro e instalación de mobiliario urbano',
          'Servicio de recogida de residuos sólidos urbanos',
          'Obras de reforma del polideportivo municipal',
          'Mantenimiento preventivo de ascensores',
          'Campaña de comunicación institucional',
          'Servicio de telecomunicaciones y conectividad',
        ];
        const ORGANOS = [
          'Ayto. de Madrid', 'Junta de Andalucía', 'Diputación de Barcelona', 'SERGAS',
          'Generalitat Valenciana', 'Ayto. de Sevilla', 'Gobierno de Aragón', 'SACYL',
          'Universidad de Granada', 'Cabildo de Tenerife', 'ADIF', 'Puertos del Estado',
          'Ayto. de Bilbao', 'Xunta de Galicia', 'Comunidad de Madrid', 'SAS',
        ];
        const rint = (n: number) => Math.floor(Math.random() * n);
        const pick = <T,>(a: T[]) => a[rint(a.length)];
        const code = () => `${2024 + rint(3)}/${pick(['SUMI', 'SERV', 'OBRA', 'CONS', 'GEST'])}/${String(rint(9999)).padStart(4, '0')}`;
        const importe = () => `${((rint(960) + 40) * 1000).toLocaleString('es-ES')} €`;

        const COLS = parseInt(getComputedStyle(field).columnCount, 10) || 3;
        const TOTAL = COLS >= 3 ? 72 : COLS === 2 ? 52 : 30;
        const MATCH_AT = Math.floor(TOTAL * 0.46);
        const frag = document.createDocumentFragment();
        for (let i = 0; i < TOTAL; i++) {
          const row = document.createElement('div');
          row.className = 'hf-row';
          if (i === MATCH_AT) {
            row.classList.add('match');
            row.innerHTML = '<span class="c">2024/SUMI/0042</span><span class="t">Mantenimiento integral de climatización — Hospital U. Virgen del Rocío</span><span class="a">340.000 €</span>';
          } else {
            row.innerHTML = `<span class="c">${code()}</span><span class="t">${pick(OBJETOS)} · ${pick(ORGANOS)}</span><span class="a">${importe()}</span>`;
          }
          frag.appendChild(row);
        }
        field.appendChild(frag);
      }

      // 2) Animación — SIEMPRE (lee las filas del DOM, no de la construcción)
      const rows = Array.from(field.querySelectorAll<HTMLElement>('.hf-row'));
      const MATCH_AT = rows.findIndex((r) => r.classList.contains('match'));

      const centers: number[] = [];
      const measure = () => {
        const fr = field.getBoundingClientRect();
        rows.forEach((r, j) => {
          const rr = r.getBoundingClientRect();
          centers[j] = (rr.top - fr.top) + rr.height / 2;
        });
        return fr.height;
      };
      let fieldH = measure();
      const onResize = () => { fieldH = measure(); };
      window.addEventListener('resize', onResize, { passive: true });
      cleanups.push(() => window.removeEventListener('resize', onResize));

      if (reduced) {
        rows.forEach((r, k) => { if (k % 4 === 0) r.classList.add('lit'); });
      } else if (scan) {
        scan.classList.add('on');
        const DUR = 6200, BAND = 30;
        const start = performance.now();
        const lit: boolean[] = [];
        let scanId = 0;
        const loop = (now: number) => {
          const p = ((now - start) % DUR) / DUR;
          const y = p * (fieldH + 120) - 60;
          scan.style.transform = `translateY(${y}px)`;
          for (let j = 0; j < rows.length; j++) {
            if (j === MATCH_AT) continue;
            const near = Math.abs(centers[j] - y) < BAND;
            if (near && !lit[j]) { rows[j].classList.add('lit'); lit[j] = true; }
            else if (!near && lit[j]) { rows[j].classList.remove('lit'); lit[j] = false; }
          }
          scanId = requestAnimationFrame(loop);
        };
        scanId = requestAnimationFrame(loop);
        cleanups.push(() => cancelAnimationFrame(scanId));
      }

      const hero = field.closest('.hero');
      if (hero && spot && finePointer) {
        const onMove = (e: Event) => {
          const me = e as MouseEvent;
          const r = hero.getBoundingClientRect();
          spot.style.setProperty('--sx', `${me.clientX - r.left}px`);
          spot.style.setProperty('--sy', `${me.clientY - r.top}px`);
        };
        hero.addEventListener('mousemove', onMove);
        cleanups.push(() => hero.removeEventListener('mousemove', onMove));
      }
    }

    return () => {
      cleanups.forEach((fn) => fn());
      rafs.forEach((id) => cancelAnimationFrame(id));
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [rootRef]);
}
