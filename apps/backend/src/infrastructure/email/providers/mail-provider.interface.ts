/**
 * Interfaz agnóstica del proveedor de email.
 *
 * "Agnóstica" significa que no sabe NI le importa quién implementa
 * la interfaz. Cualquier clase que cumpla este contrato vale.
 *
 * Esta interfaz es nuestra "estrategia" abstracta del patrón Strategy.
 * Las clases concretas (ResendMailProvider, etc.) son las "estrategias
 * concretas".
 *
 * ¿Por qué hacerlo así?
 * 1. Cambiar de proveedor sin tocar EmailService ni a sus consumers.
 * 2. Mockear en tests con un MockMailProvider que solo guarda en memoria.
 * 3. EmailService queda más limpio: solo conoce esta interfaz, no SDKs.
 */

/**
 * Parámetros para enviar un email.
 * Cualquier proveedor que implemente IMailProvider acepta esto.
 */
export interface SendEmailParams {
  /** Destinatario(s). Puede ser un email o un array de emails. */
  to: string | string[];
  /** Asunto del email (la línea que ves en negrita en tu inbox). */
  subject: string;
  /** Cuerpo HTML del email. Lo que ve el usuario formateado. */
  html: string;
  /** Cuerpo en texto plano (sin formato). Fallback para clientes
   *  de email viejos o filtros antispam. Es buena práctica enviar
   *  ambos. */
  text?: string;
  /** Email del remitente. Si no se especifica, el provider usa su
   *  default (configurado en su constructor). */
  from?: string;
  /** Email al que el usuario debería responder, si es distinto del
   *  remitente. Útil cuando enviamos desde "noreply@" pero queremos
   *  que respondan a "soporte@". */
  replyTo?: string;
}

/**
 * Resultado de un envío exitoso.
 * Cualquier proveedor lo devuelve tras enviar.
 */
export interface MailProviderResult {
  /** Identificador único del envío en el proveedor.
   *  Útil para debug: "el email X que dije que envié, ¿llegó?". */
  messageId: string;
  /** Identificador del proveedor (ej. 'resend', 'sendgrid', 'ses').
   *  Útil en logs para saber quién envió qué. */
  provider: string;
}

/**
 * El contrato que cualquier proveedor de email debe cumplir.
 *
 * Si mañana queremos cambiar de Resend a AWS SES, creamos un
 * `SesMailProvider implements IMailProvider` y listo.
 */
export interface IMailProvider {
  /**
   * Envía un email.
   * Si falla, lanza un error. Es responsabilidad de quien llama
   * decidir si reintentar, ignorar, o propagar al usuario.
   */
  sendEmail(params: SendEmailParams): Promise<MailProviderResult>;

  /**
   * Identificador del proveedor (para logging).
   * Implementaciones lo definen como readonly: 'resend', 'ses', etc.
   */
  readonly providerName: string;
}

/**
 * Token de inyección.
 *
 * Esto es un truco de NestJS que necesita explicación:
 *
 * En TypeScript, las interfaces NO existen en runtime. Cuando el código
 * compila a JavaScript, las interfaces desaparecen. Por tanto, NestJS
 * no puede decir "inyectame algo que implemente IMailProvider" porque
 * en runtime no sabe qué es IMailProvider.
 *
 * La solución es usar un "token" que sí existe en runtime: un Symbol.
 * Un Symbol es un valor único. `Symbol('MAIL_PROVIDER')` crea un Symbol
 * con la descripción 'MAIL_PROVIDER' (la descripción es solo para
 * humanos; no afecta a la unicidad).
 *
 * NestJS usa ese Symbol como "etiqueta": cualquier provider registrado
 * bajo MAIL_PROVIDER se inyecta donde se pida `@Inject(MAIL_PROVIDER)`.
 *
 * ¿Por qué Symbol y no un string?
 * - Un string ('MAIL_PROVIDER') puede colisionar con otros tokens
 *   que usen el mismo string.
 * - Un Symbol es ÚNICO. Aunque alguien haga otro Symbol('MAIL_PROVIDER'),
 *   son dos Symbols distintos. No hay colisiones nunca.
 *
 * Uso típico:
 *   // En un servicio:
 *   constructor(@Inject(MAIL_PROVIDER) private mailProvider: IMailProvider) {}
 *
 *   // En un módulo:
 *   providers: [{ provide: MAIL_PROVIDER, useClass: ResendMailProvider }]
 */
export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');