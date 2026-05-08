/**
 * DTO (Data Transfer Object) de envío de email genérico.
 *
 * Usado por EmailService.sendEmail() — la API "interna" de nuestro
 * backend para enviar emails. Quien llama no necesita saber del
 * provider (Resend, SES, etc.); solo necesita estos campos.
 *
 * Notar que es muy parecido a SendEmailParams de mail-provider.interface.ts.
 * Lo mantenemos como tipo separado por dos razones:
 * 1. EmailService trabaja en el dominio "envío de email del producto"
 *    (con sus reglas, plantillas, etc.); el provider trabaja en el
 *    dominio "envío técnico de email". Separar tipos refleja
 *    separar responsabilidades.
 * 2. Si en el futuro EmailService añade campos como `tracking: true`
 *    o `template: WELCOME_EMAIL`, no tendría sentido que esos campos
 *    contaminen la interfaz del provider.
 */
export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}