// import { Injectable, NotFoundException } from '@nestjs/common';
// import {
//   S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand,
// } from '@aws-sdk/client-s3'; // requiere: npm i @aws-sdk/client-s3
// import { randomUUID } from 'crypto';
// import { extname } from 'path';
// import { Readable } from 'stream';
// import type { IStorageProvider, SaveFileParams, SavedFile } from '../storage.types';

// /**
//  * Compatible con AWS S3, Cloudflare R2 y MinIO (cambia S3_ENDPOINT).
//  * Activar con STORAGE_PROVIDER_TYPE=s3 y descomentar en storage.module.ts.
//  */
// @Injectable()
// export class S3StorageProvider implements IStorageProvider {
//   public readonly providerName = 's3';
//   private readonly bucket = process.env.S3_BUCKET ?? '';
//   private readonly client = new S3Client({
//     region: process.env.S3_REGION ?? 'auto',
//     endpoint: process.env.S3_ENDPOINT || undefined, // R2/MinIO
//     credentials: {
//       accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
//       secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
//     },
//   });

//   async save({ buffer, originalName, mimeType, scope }: SaveFileParams): Promise<SavedFile> {
//     const key = `${scope.replace(/[^a-zA-Z0-9/_-]/g, '')}/${randomUUID()}${extname(originalName).toLowerCase()}`;
//     await this.client.send(new PutObjectCommand({
//       Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType,
//     }));
//     return { key, sizeBytes: buffer.byteLength };
//   }

//   async getStream(key: string): Promise<Readable> {
//     const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
//     if (!res.Body) throw new NotFoundException('Archivo no encontrado');
//     return res.Body as Readable;
//   }

//   async delete(key: string): Promise<void> {
//     await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
//   }

//   async exists(key: string): Promise<boolean> {
//     try {
//       await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
//       return true;
//     } catch {
//       return false;
//     }
//   }
// }