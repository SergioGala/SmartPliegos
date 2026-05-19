import { z } from 'zod';
import { Timezone } from '../../../modules/users/enums';

const TIMEZONE_VALUES = Object.values(Timezone) as [Timezone, ...Timezone[]];

export const timezoneSchema = z.enum(TIMEZONE_VALUES);

export const optionalTimezoneSchema = timezoneSchema.optional().default(Timezone.UTC);