import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Returns the public CDN URL for an escudo image.
 * Falls back to the local placeholder SVG if no filename is provided.
 */
export function getEscudoUrl(filename: string | null): string {
  if (!filename) return '/placeholder-escudo.svg';
  return `${process.env.R2_PUBLIC_URL}/escudos/${filename}`;
}

/**
 * Upload a buffer to R2.
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}
