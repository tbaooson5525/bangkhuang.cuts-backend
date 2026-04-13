import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  // Upload file buffer lên Cloudinary qua stream — không lưu vào disk/memory
  uploadStream(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  // Generate signed params để FE upload thẳng (gallery)
  generateSignature(folder: string) {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.config.get('CLOUDINARY_API_SECRET')!,
    );
    return {
      signature,
      timestamp,
      apiKey: this.config.get('CLOUDINARY_API_KEY')!,
      cloudName: this.config.get('CLOUDINARY_CLOUD_NAME')!,
      folder,
    };
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  getUrl(
    publicId: string,
    type: 'avatar' | 'thumbnail' | 'profile' | 'galleryThumb' | 'galleryFull',
  ): string {
    const transforms = {
      avatar: 'w_200,h_200,c_fill,f_webp,q_80',
      thumbnail: 'w_400,h_400,c_fill,f_webp,q_80',
      profile: 'w_1200,h_1600,c_fill,f_webp,q_90',
      galleryThumb: 'w_512,h_512,c_fill,f_webp,q_80',
      galleryFull: 'w_1024,f_webp,q_85',
    };
    const cloud = this.config.get('CLOUDINARY_CLOUD_NAME');
    return `https://res.cloudinary.com/${cloud}/image/upload/${transforms[type]}/${publicId}`;
  }
}
