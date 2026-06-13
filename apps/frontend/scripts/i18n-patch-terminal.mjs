// 📍 DESTINO: apps/frontend/scripts/i18n-patch-terminal.mjs
//
// Cierra el último cabo de i18n: añade las claves nuevas que el rediseño usaba
// con `defaultValue` (Buscar, Detalle, panel de Auth y el error de Alertas) a
// los locales de los 6 idiomas. SOLO añade claves que falten — nunca pisa una
// traducción existente. Es idempotente (córrelo dos veces y la 2ª no hace nada).
//
// USO (desde apps/frontend):
//   node scripts/i18n-patch-terminal.mjs
//
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCALES = resolve('src/i18n/locales');
if (!existsSync(LOCALES)) {
  console.error(`✗ No encuentro ${LOCALES}.\n  Ejecuta el script desde apps/frontend:  node scripts/i18n-patch-terminal.mjs`);
  process.exit(1);
}

const LANGS = ['es', 'en', 'ca', 'eu', 'gl', 'pt'];

// ─── Claves nuevas por idioma y namespace ───
const PATCH = {
  es: {
    search: {
      source: { official: 'Fuente oficial' },
      page: { searchHeading: 'buscar entre {{count}} licitaciones…' },
      results: { count: 'resultados', errorTitle: 'No se pudieron cargar las licitaciones' },
      sort: { label: 'Orden', fecha: 'Fecha', importe: 'Importe', deadline: 'Plazo' },
      detail: {
        backToTerminal: 'Volver a la terminal', remaining: 'restantes', publishedShort: 'Publicada',
        hasLots: 'División en lotes', yes: 'Sí', no: 'No', documentFallback: 'Documento',
        ivaExcluded: 'IVA excluido', deadlineWord: 'Plazo', presentationIn: 'Presentación en',
        day: 'día', days: 'días',
      },
    },
    common: { authPanel: {
      eyebrow: 'acceso',
      headline: 'Encuentra tu próximo contrato entre 288.000 licitaciones públicas.',
      lead: 'Búsqueda inteligente, alertas en tiempo real y resúmenes con IA. Datos oficiales de PLACE.',
      footer: 'Gratis · sin tarjeta',
    } },
    auth: { login: { tab: 'Iniciar sesión' }, register: { tab: 'Crear cuenta' }, divider: { email: 'o con tu email' } },
    alerts: { page: { errorTitle: 'No se pudieron cargar tus alertas' } },
  },

  en: {
    search: {
      source: { official: 'Official source' },
      page: { searchHeading: 'search across {{count}} tenders…' },
      results: { count: 'results', errorTitle: "Couldn't load the tenders" },
      sort: { label: 'Sort', fecha: 'Date', importe: 'Amount', deadline: 'Deadline' },
      detail: {
        backToTerminal: 'Back to terminal', remaining: 'remaining', publishedShort: 'Published',
        hasLots: 'Split into lots', yes: 'Yes', no: 'No', documentFallback: 'Document',
        ivaExcluded: 'VAT excluded', deadlineWord: 'Deadline', presentationIn: 'Submission in',
        day: 'day', days: 'days',
      },
    },
    common: { authPanel: {
      eyebrow: 'access',
      headline: 'Find your next contract among 288,000 public tenders.',
      lead: 'Smart search, real-time alerts and AI summaries. Official PLACE data.',
      footer: 'Free · no card',
    } },
    auth: { login: { tab: 'Log in' }, register: { tab: 'Sign up' }, divider: { email: 'or with your email' } },
    alerts: { page: { errorTitle: "Couldn't load your alerts" } },
  },

  ca: {
    search: {
      source: { official: 'Font oficial' },
      page: { searchHeading: 'cerca entre {{count}} licitacions…' },
      results: { count: 'resultats', errorTitle: "No s'han pogut carregar les licitacions" },
      sort: { label: 'Ordena', fecha: 'Data', importe: 'Import', deadline: 'Termini' },
      detail: {
        backToTerminal: 'Torna a la terminal', remaining: 'restants', publishedShort: 'Publicada',
        hasLots: 'Divisió en lots', yes: 'Sí', no: 'No', documentFallback: 'Document',
        ivaExcluded: 'IVA exclòs', deadlineWord: 'Termini', presentationIn: 'Presentació en',
        day: 'dia', days: 'dies',
      },
    },
    common: { authPanel: {
      eyebrow: 'accés',
      headline: 'Troba el teu pròxim contracte entre 288.000 licitacions públiques.',
      lead: 'Cerca intel·ligent, alertes en temps real i resums amb IA. Dades oficials de PLACE.',
      footer: 'Gratis · sense targeta',
    } },
    auth: { login: { tab: 'Inicia sessió' }, register: { tab: 'Crea compte' }, divider: { email: 'o amb el teu email' } },
    alerts: { page: { errorTitle: "No s'han pogut carregar les teves alertes" } },
  },

  eu: {
    search: {
      source: { official: 'Iturri ofiziala' },
      page: { searchHeading: 'bilatu {{count}} lizitaziotan…' },
      results: { count: 'emaitzak', errorTitle: 'Ezin izan dira lizitazioak kargatu' },
      sort: { label: 'Ordenatu', fecha: 'Data', importe: 'Zenbatekoa', deadline: 'Epea' },
      detail: {
        backToTerminal: 'Itzuli terminalera', remaining: 'geratzen', publishedShort: 'Argitaratua',
        hasLots: 'Loteetan banatua', yes: 'Bai', no: 'Ez', documentFallback: 'Dokumentua',
        ivaExcluded: 'BEZ kanpo', deadlineWord: 'Epea', presentationIn: 'Aurkezpena:',
        day: 'egun', days: 'egun',
      },
    },
    common: { authPanel: {
      eyebrow: 'sarbidea',
      headline: 'Aurkitu zure hurrengo kontratua 288.000 lizitazio publikoren artean.',
      lead: 'Bilaketa adimenduna, denbora errealeko alertak eta IA bidezko laburpenak. PLACEko datu ofizialak.',
      footer: 'Doan · txartelik gabe',
    } },
    auth: { login: { tab: 'Saioa hasi' }, register: { tab: 'Kontua sortu' }, divider: { email: 'edo zure emailarekin' } },
    alerts: { page: { errorTitle: 'Ezin izan dira zure alertak kargatu' } },
  },

  gl: {
    search: {
      source: { official: 'Fonte oficial' },
      page: { searchHeading: 'busca entre {{count}} licitacións…' },
      results: { count: 'resultados', errorTitle: 'Non se puideron cargar as licitacións' },
      sort: { label: 'Orde', fecha: 'Data', importe: 'Importe', deadline: 'Prazo' },
      detail: {
        backToTerminal: 'Volver á terminal', remaining: 'restantes', publishedShort: 'Publicada',
        hasLots: 'División en lotes', yes: 'Si', no: 'Non', documentFallback: 'Documento',
        ivaExcluded: 'IVE excluído', deadlineWord: 'Prazo', presentationIn: 'Presentación en',
        day: 'día', days: 'días',
      },
    },
    common: { authPanel: {
      eyebrow: 'acceso',
      headline: 'Atopa o teu próximo contrato entre 288.000 licitacións públicas.',
      lead: 'Busca intelixente, alertas en tempo real e resumos con IA. Datos oficiais de PLACE.',
      footer: 'Gratis · sen tarxeta',
    } },
    auth: { login: { tab: 'Iniciar sesión' }, register: { tab: 'Crear conta' }, divider: { email: 'ou co teu email' } },
    alerts: { page: { errorTitle: 'Non se puideron cargar as túas alertas' } },
  },

  pt: {
    search: {
      source: { official: 'Fonte oficial' },
      page: { searchHeading: 'pesquisar entre {{count}} concursos…' },
      results: { count: 'resultados', errorTitle: 'Não foi possível carregar os concursos' },
      sort: { label: 'Ordenar', fecha: 'Data', importe: 'Montante', deadline: 'Prazo' },
      detail: {
        backToTerminal: 'Voltar à terminal', remaining: 'restantes', publishedShort: 'Publicada',
        hasLots: 'Divisão em lotes', yes: 'Sim', no: 'Não', documentFallback: 'Documento',
        ivaExcluded: 'IVA excluído', deadlineWord: 'Prazo', presentationIn: 'Apresentação em',
        day: 'dia', days: 'dias',
      },
    },
    common: { authPanel: {
      eyebrow: 'acesso',
      headline: 'Encontra o teu próximo contrato entre 288.000 concursos públicos.',
      lead: 'Pesquisa inteligente, alertas em tempo real e resumos com IA. Dados oficiais do PLACE.',
      footer: 'Grátis · sem cartão',
    } },
    auth: { login: { tab: 'Iniciar sessão' }, register: { tab: 'Criar conta' }, divider: { email: 'ou com o teu email' } },
    alerts: { page: { errorTitle: 'Não foi possível carregar os teus alertas' } },
  },
};

// ─── Merge: añade solo claves que falten, nunca pisa ───
function addMissing(target, patch) {
  let added = 0;
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (typeof target[k] !== 'object' || target[k] === null || Array.isArray(target[k])) target[k] = {};
      added += addMissing(target[k], v);
    } else if (!(k in target)) {
      target[k] = v;
      added++;
    }
  }
  return added;
}

let totalAdded = 0;
let touched = 0;
for (const lang of LANGS) {
  for (const ns of Object.keys(PATCH[lang])) {
    const path = resolve(LOCALES, lang, `${ns}.json`);
    if (!existsSync(path)) {
      console.warn(`  ⚠ ${lang}/${ns}.json no existe, lo salto`);
      continue;
    }
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const added = addMissing(data, PATCH[lang][ns]);
    if (added > 0) {
      writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`  ✓ ${lang}/${ns}.json  +${added}`);
      totalAdded += added;
      touched++;
    }
  }
}

console.log(`\n${touched ? `✅ ${touched} ficheros actualizados, +${totalAdded} claves añadidas.` : 'Nada que hacer: ya estaban todas las claves.'}`);
console.log('   (Reinicia el dev server para que Vite re-empaquete los JSON.)');
