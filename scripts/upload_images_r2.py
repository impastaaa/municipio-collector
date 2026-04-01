#!/usr/bin/env python3
"""
upload_images_r2.py
───────────────────
Uploads escudo images from the local ./images/ directory to Cloudflare R2.

Usage:
    R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... \
        python upload_images_r2.py --images-dir images

Requires: boto3
    pip install boto3
"""

import argparse
import mimetypes
import os
import sys
from pathlib import Path

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    print("ERROR: boto3 not installed. Run: pip install boto3")
    sys.exit(1)

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"}


def get_r2_client():
    account_id = os.environ["R2_ACCOUNT_ID"]
    access_key = os.environ["R2_ACCESS_KEY_ID"]
    secret_key = os.environ["R2_SECRET_ACCESS_KEY"]

    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Upload escudo images to Cloudflare R2"
    )
    parser.add_argument("--images-dir", default="images", help="Local images directory")
    parser.add_argument(
        "--prefix", default="escudos", help="R2 key prefix (default: escudos)"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview without uploading"
    )
    args = parser.parse_args()

    bucket = os.environ.get("R2_BUCKET_NAME")
    if not bucket:
        print("ERROR: R2_BUCKET_NAME environment variable not set")
        sys.exit(1)

    images_dir = Path(args.images_dir)
    if not images_dir.exists():
        print(f"ERROR: Images directory '{images_dir}' not found")
        sys.exit(1)

    image_files = [
        f
        for f in images_dir.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    ]
    print(f"Found {len(image_files)} images in {images_dir}/")

    if args.dry_run:
        print("[DRY RUN] Would upload:")
        for f in image_files[:10]:
            print(f"  {args.prefix}/{f.name}")
        if len(image_files) > 10:
            print(f"  … and {len(image_files) - 10} more")
        return

    client = get_r2_client()
    uploaded = 0
    skipped = 0
    errors = 0

    for i, img_path in enumerate(image_files, 1):
        key = f"{args.prefix}/{img_path.name}"
        content_type = mimetypes.guess_type(img_path.name)[0] or "image/png"

        try:
            # Check if already exists
            try:
                client.head_object(Bucket=bucket, Key=key)
                skipped += 1
                if i % 100 == 0:
                    print(
                        f"  [{i}/{len(image_files)}] {skipped} skipped, {uploaded} uploaded…"
                    )
                continue
            except ClientError as e:
                if e.response["Error"]["Code"] != "404":
                    raise

            client.upload_file(
                str(img_path),
                bucket,
                key,
                ExtraArgs={"ContentType": content_type},
            )
            uploaded += 1

            if i % 100 == 0 or i == len(image_files):
                print(
                    f"  [{i}/{len(image_files)}] {uploaded} uploaded, {skipped} skipped, {errors} errors"
                )

        except Exception as e:
            print(f"  ERROR uploading {img_path.name}: {e}")
            errors += 1

    print(f"\n✓ Upload complete.")
    print(f"  Uploaded : {uploaded}")
    print(f"  Skipped  : {skipped} (already existed)")
    print(f"  Errors   : {errors}")
    print(
        f"\nR2 CORS reminder: ensure the bucket allows your app's origin for html2canvas to work."
    )
    print("  See: https://developers.cloudflare.com/r2/buckets/cors/")


if __name__ == "__main__":
    main()
