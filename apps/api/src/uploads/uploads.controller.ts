import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Multer } from 'multer';

// Multer file type for multer v2 compatibility
type MulterFile = Multer extends { single: (...args: any[]) => any }
  ? Parameters<ReturnType<Multer['single']>>[2] extends (err: any, ...args: infer R) => void
    ? never
    : never
  : never;

interface UploadedFileData {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp|heic|heif)$/ }),
        ],
      }),
    )
    file: UploadedFileData,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadsService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Get(':key')
  async getFile(@Param('key') key: string, @Res() res: any) {
    if (!key) {
      throw new BadRequestException('File key is required');
    }
    
    // Generate a temporary presigned URL for this private file
    const url = await this.uploadsService.getPresignedDownloadUrl(key);
    
    // Redirect the browser to the secure B2 URL
    return res.redirect(302, url);
  }
}
