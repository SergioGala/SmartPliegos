import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './document.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { CommonModule } from '../../common/common.module';
// StorageModule es @Global → no hace falta importarlo aquí.

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity]), CommonModule,],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}