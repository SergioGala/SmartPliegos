# Design Tokens — SmartPliegos

Sistema de tokens definidos en `apps/frontend/src/index.css`. Tres capas:

- `@theme inline` → puentes entre Tailwind y CSS vars. Es lo que hace que `bg-primary`, `text-success`, `shadow-glow`, etc. funcionen como clases.
- `:root` → valores en modo claro.
- `.dark` → valores en modo oscuro.

Tailwind v4 + CSS vars. La gracia: cambias el valor en un sitio y se actualiza toda la app.

## Qué token usar cuándo

| Necesito... | Token | Clase típica |
|---|---|---|
| Fondo de página | `background` | `bg-background` |
| Fondo de tarjeta o panel | `card` | `bg-card` |
| Texto principal | `foreground` | `text-foreground` |
| Texto secundario / atenuado | `muted-foreground` | `text-muted-foreground` |
| Color de marca, CTAs, links destacados | `primary` | `bg-primary text-primary-foreground` |
| Fondo gris sutil (inputs, chips, hovers neutros) | `muted` | `bg-muted` |
| Acento más vivo (hovers de items activos) | `accent` | `bg-accent text-accent-foreground` |
| Éxito (licitación abierta, OK) | `success` | `bg-success text-success-foreground` |
| Aviso (plazo cerca, atención, desierta) | `warning` | `bg-warning text-warning-foreground` |
| Error / destructivo (cancelado, fallo) | `destructive` | `bg-destructive text-destructive-foreground` |
| Bordes | `border` | `border-border` |
| Anillo de foco al tabular | `ring` | `ring-ring` |
| Resplandor sutil de marca | — | `shadow-glow` |
| Resplandor grande (héroes, logos hero) | — | `shadow-glow-lg` |

## Convención de "foreground"

Cada color de fondo coloreado tiene su `-foreground` correspondiente para el texto encima:

- `bg-primary` + `text-primary-foreground`
- `bg-success` + `text-success-foreground`
- `bg-warning` + `text-warning-foreground`
- `bg-destructive` + `text-destructive-foreground`

**No inventes el color del texto** sobre un fondo coloreado: usa siempre su `-foreground`. Eso garantiza contraste correcto en modo claro y oscuro.

## Reglas estrictas

1. **Nada de colores fijos** (`bg-emerald-500`, `text-red-600`, `bg-slate-400`). Si necesitas un color nuevo, se añade como token nuevo, no como clase suelta.
2. **Nada de `style={{}}` inline para colores o sombras**. Si lo que necesitas es estático, usa la clase del token. Si es dinámico (depende de una prop o cálculo JS), está permitido pero **deja un comentario** justo encima explicando por qué:
```tsx
   // dynamic: animationDelay depende del index para escalonar
   style={{ animationDelay: `${index * 20}ms` }}
```
3. **El estado de las licitaciones se mapea desde `ESTADO_CONFIG`** en `features/licitaciones/utils.ts`. Si añades un estado nuevo, va ahí, no en componentes sueltos.

## Añadir un token nuevo

Tres sitios, en este orden:

1. `index.css` línea ~30 — añadir el puente `@theme inline`:
```css
   --color-mitoken: var(--mitoken);
   --color-mitoken-foreground: var(--mitoken-foreground);
```
2. `index.css` dentro de `:root` — valor en modo claro:
```css
   --mitoken: oklch(0.65 0.18 200);
   --mitoken-foreground: oklch(0.99 0 0);
```
3. `index.css` dentro de `.dark` — valor en modo oscuro (sube la L, mantén C y H):
```css
   --mitoken: oklch(0.75 0.18 200);
   --mitoken-foreground: oklch(0.99 0 0);
```

Después, en cualquier componente: `bg-mitoken`, `text-mitoken-foreground`, etc.

## Por qué `oklch` y no `hex`

`oklch(L C H)` = Lightness, Chroma, Hue. Las grandes ventajas:

- **Dark mode casi automático**: mismo H y C, sube la L. Mira cómo está hecho `--primary` en el código.
- **Opacidad sin saber el valor**: `oklch(from var(--primary) l c h / 0.3)` toma `--primary` y le pone 30%. Imposible con hex.

## Historial de cambios

- 2026-05: tokens semánticos `success`, `warning`, `shadow-glow`, `shadow-glow-lg`. Migración de `ESTADO_CONFIG` a tokens. (Carril C3)