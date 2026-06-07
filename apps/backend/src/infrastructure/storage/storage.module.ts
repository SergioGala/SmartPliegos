import { Global, Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.types';
import { LocalDiskStorageProvider } from './providers/local-disk.storage.provider';
// import { S3StorageProvider } from './providers/s3.storage.provider'; // futuro

@Global()
@Module({
  providers: [
    LocalDiskStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [LocalDiskStorageProvider],
      useFactory: (local: LocalDiskStorageProvider /*, s3 */) => {
        const type = process.env.STORAGE_PROVIDER_TYPE ?? 'local';
        // return type === 's3' ? s3 : local;
        return local;
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}