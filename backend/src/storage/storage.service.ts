import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class StorageService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
    this.ensureDir(this.uploadDir);
    this.ensureDir(path.join(this.uploadDir, 'avatars'));
    this.ensureDir(path.join(this.uploadDir, 'posts'));
    this.ensureDir(path.join(this.uploadDir, 'stories'));
    this.ensureDir(path.join(this.uploadDir, 'messages'));
  }

  async saveFile(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const dir = path.join(this.uploadDir, folder);
    this.ensureDir(dir);

    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, file.buffer);

    return `/uploads/${folder}/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const filepath = path.join(this.uploadDir, '..', fileUrl);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
