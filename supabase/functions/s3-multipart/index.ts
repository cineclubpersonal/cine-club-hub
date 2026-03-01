import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from "npm:@aws-sdk/client-s3@3.600.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.600.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getS3() {
  return new S3Client({
    region: Deno.env.get("AWS_S3_REGION")!,
    credentials: {
      accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
    },
  });
}

const BUCKET = Deno.env.get("AWS_S3_BUCKET")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json().catch(() => ({}));
    const s3 = getS3();

    if (action === "createMultipartUpload") {
      const key = `uploads/${crypto.randomUUID()}-${body.filename}`;
      const res = await s3.send(
        new CreateMultipartUploadCommand({
          Bucket: BUCKET,
          Key: key,
          ContentType: body.contentType || "application/octet-stream",
        })
      );
      return json({ key, uploadId: res.UploadId });
    }

    if (action === "listParts") {
      const res = await s3.send(
        new ListPartsCommand({ Bucket: BUCKET, Key: body.key, UploadId: body.uploadId })
      );
      const parts = (res.Parts || []).map((p) => ({
        PartNumber: p.PartNumber,
        Size: p.Size,
        ETag: p.ETag,
      }));
      return json({ parts });
    }

    if (action === "signPart") {
      const presignedUrl = await getSignedUrl(
        s3,
        new UploadPartCommand({
          Bucket: BUCKET,
          Key: body.key,
          UploadId: body.uploadId,
          PartNumber: body.partNumber,
        }),
        { expiresIn: 3600 }
      );
      return json({ url: presignedUrl });
    }

    if (action === "completeMultipartUpload") {
      const res = await s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: BUCKET,
          Key: body.key,
          UploadId: body.uploadId,
          MultipartUpload: {
            Parts: body.parts.map((p: { PartNumber: number; ETag: string }) => ({
              PartNumber: p.PartNumber,
              ETag: p.ETag,
            })),
          },
        })
      );
      return json({ location: res.Location });
    }

    if (action === "abortMultipartUpload") {
      await s3.send(
        new AbortMultipartUploadCommand({
          Bucket: BUCKET,
          Key: body.key,
          UploadId: body.uploadId,
        })
      );
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});
