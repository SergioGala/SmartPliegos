import { z } from 'zod';

const PHONE_REGEX = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

export const phoneSchema = z
  .string()
  .regex(PHONE_REGEX, 'phone must match a valid format (e.g. +34 912 345 678)');

export const optionalPhoneSchema = phoneSchema.optional();