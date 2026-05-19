import { createAlertSchema } from "./create-alert.dto";

describe('createAlertSchema', () => {
    it('accepts a valid createAlert payload', () => {
        const result = createAlertSchema.safeParse({
            name: 'Alerta de ejemplo',
            description: 'Descripción de ejemplo',
            email: 'user@example.com',
            estados: ['ABIERTA', 'CERRADA'],
            tiposContrato: ['OBRAS', 'SERVICIOS'],
            procedimientos: ['ABIERTO', 'RESTRINGIDO'],
            tramitacion: ['ORDINARIA', 'URGENTE'],
            ccaa: ['Madrid', 'Cataluña'],
            provincia: ['Madrid', 'Barcelona'],
            cpvCodes: [''],
            importeMin: 0,
            importeMax: 0,
            palabrasClave: 'palabraClave',
            isActive: true,
        });
        expect(result.success).toBe(true);
    });

    it('normalizes email to lowercase', () => {
        const result = createAlertSchema.parse({
            email: 'USER@example.com',
            name: 'Alerta de ejemplo',
            description: 'Descripción de ejemplo',
            estados: ['ABIERTA', 'CERRADA'],
            tiposContrato: ['OBRAS', 'SERVICIOS'],
            procedimientos: ['ABIERTO', 'RESTRINGIDO'],
            tramitacion: ['ORDINARIA', 'URGENTE'],
            ccaa: ['Madrid', 'Cataluña'],
            provincia: ['Madrid', 'Barcelona'],
            cpvCodes: [''],
            importeMin: 0,
            importeMax: 0,
            palabrasClave: 'palabraClave',
            isActive: true,
        });
        expect(result.email).toBe('user@example.com');
    });

    it('rejects malformed emails', () => {
        const result = createAlertSchema.safeParse({
            email: 'not-an-email',
            name: 'Alerta de ejemplo',
            description: 'Descripción de ejemplo',
            estados: ['ABIERTA', 'CERRADA'],
            tiposContrato: ['OBRAS', 'SERVICIOS'],
            procedimientos: ['ABIERTO', 'RESTRINGIDO'],
            tramitacion: ['ORDINARIA', 'URGENTE'],
            ccaa: ['Madrid', 'Cataluña'],
            provincia: ['Madrid', 'Barcelona'],
            cpvCodes: [''],
            importeMin: 0,
            importeMax: 0,
            palabrasClave: 'palabraClave',
            isActive: true,
        });
        expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
        const result = createAlertSchema.safeParse({
            email: 'user@example.com',
            name: '',
            description: 'Descripción de ejemplo',
            estados: ['ABIERTA', 'CERRADA'],
            tiposContrato: ['OBRAS', 'SERVICIOS'],
            procedimientos: ['ABIERTO', 'RESTRINGIDO'],
            tramitacion: ['ORDINARIA', 'URGENTE'],
            ccaa: ['Madrid', 'Cataluña'],
            provincia: ['Madrid', 'Barcelona'],
            cpvCodes: [''],
            importeMin: 0,
            importeMax: 0,
            palabrasClave: 'palabraClave',
            isActive: true,
        });
        expect(result.success).toBe(false);
    });

});