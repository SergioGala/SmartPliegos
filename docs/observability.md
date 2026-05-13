# Observabilidad del backend

## Estado actual

| Capa | Herramienta | Estado |
|---|---|---|
| Logs estructurados | Winston (nest-winston) | ✅ activo |
| Error tracking runtime | Sentry | ✅ activo |
| Health checks | @nestjs/terminus + custom | ✅ activo |
| CI checks | GitHub Actions | ✅ activo |

## Pendiente para Fase 7 (Lanzamiento)

| Capa | Herramienta planificada |
|---|---|
| Uptime monitoring | UptimeRobot (free tier) |
| Analytics de producto | PostHog |
| Dashboards admin | Custom (panel admin interno) |
| Alertas a Slack/email | Sentry alerts + webhooks |

## Dónde mirar qué

- **¿La app está caída?** → `https://uptimerobot.com/...` (cuando se configure).
- **¿Hay errores en prod?** → Sentry dashboard.
- **¿Algo raro con BD/Redis?** → `curl https://api.smartpliegos.com/health`.
- **¿Build roto en main?** → GitHub Actions tab.
- **¿Logs de un endpoint?** → CloudWatch / Datadog / hosting (cuando se elija).

## Variables de entorno relacionadas

\`\`\`
SENTRY_DSN=<dsn de proyecto Sentry>
LOG_LEVEL=info  # o debug, warn, error
\`\`\`