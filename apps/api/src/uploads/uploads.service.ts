import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || '';
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL') || '';
    
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || '';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID') || '';
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY') || '';
    const region = this.configService.get<string>('S3_REGION') || 'us-east-005'; 

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(fileBuffer: Buffer, originalName: string, contentType: string) {
    try {
      const ext = path.extname(originalName);
      const key = `${randomUUID()}${ext}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      // Upload directly from the backend to Backblaze B2
      await this.s3Client.send(command);

      // Return a URL pointing to our OWN backend, which will redirect to S3
      const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';
      return {
        fileUrl: `${apiUrl}/uploads/${key}`,
      };
    } catch (error) {
      console.error('Error uploading file to B2:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // URL expires in 15 minutes
      return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }
}
