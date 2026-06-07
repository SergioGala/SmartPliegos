import {
  Controller, Post, Get, Patch, Delete, Param, Query, Res,
  UploadedFile, UseInterceptors, ParseUUIDPipe, StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { SecureAuthEndpoint, CurrentUser, RateLimitModerate } from '../../common/decorators';
import { ZodBody, ZodQuery } from '../../common/zod';
import { uploadDocumentSchema, type UploadDocumentDto, UploadDocumentDtoSwagger } from './dto/upload-document.dto';
import { updateDocumentSchema, type UpdateDocumentDto } from './dto/update-document.dto';
import { listDocumentsSchema, type ListDocumentsDto } from './dto/list-documents.dto';
import { MAX_UPLOAD_BYTES } from './documents.constants';

@ApiTags('📁 Documents')
@ApiBearerAuth('access_token')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post()
  @SecureAuthEndpoint()
  @RateLimitModerate()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentDtoSwagger })
  @ApiOperation({ summary: 'Subir un documento' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @ZodBody(uploadDocumentSchema) dto: UploadDocumentDto,
    @CurrentUser() userId: string,
  ) {
    return this.service.upload({ ownerUserId: userId, organizationId: null, file, ...dto });
  }

  @Get()
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Listar mis documentos' })
  async list(@ZodQuery(listDocumentsSchema) dto: ListDocumentsDto, @CurrentUser() userId: string) {
    return this.service.list(userId, {
      page: dto.page ?? 1, pageSize: dto.pageSize ?? 20,
      folder: dto.folder, q: dto.q, licitacionId: dto.licitacionId,
    });
  }

  @Get('usage')
  @SecureAuthEndpoint()
  async usage(@CurrentUser() userId: string) {
    return this.service.usage(userId);
  }

  @Get(':id/download')
  @SecureAuthEndpoint()
  @ApiOperation({ summary: 'Descargar un documento (stream)' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { doc, stream } = await this.service.getDownload(id, userId);
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.filename)}"`,
    });
    return new StreamableFile(stream);
  }

  @Patch(':id')
  @SecureAuthEndpoint()
  async rename(
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(updateDocumentSchema) dto: UpdateDocumentDto,
    @CurrentUser() userId: string,
  ) {
    return this.service.rename(id, userId, dto);
  }

  @Delete(':id')
  @SecureAuthEndpoint()
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() userId: string) {
    await this.service.remove(id, userId);
    return { message: 'Documento eliminado' };
  }
}