import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Buffer } from "buffer";

type Data =
  | { status: "failure"; error: string; details?: string }
  | {
      status: "success";
      data: unknown;
      url: string;
    };

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_S3_BUCKET_NAME;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { image, filename } = req.body;

  if (!image || !filename) {
    return res
      .status(400)
      .json({ status: "failure", error: "Image and filename are required" });
  }

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    return res
      .status(500)
      .json({ status: "failure", error: "missing environment variables" });
  }

  const s3 = new S3Client({
    region,
    credentials: {
      secretAccessKey,
      accessKeyId,
    },
  });

  const params = {
    Bucket: bucket,
    Key: filename,
    Body: Buffer.from(image, "base64"),
    ContentEncoding: "base64",
    ContentType: "image/jpeg",
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3.send(command);
    res.status(200).json({
      status: "success",
      data,
      url: `https://media.shaky.sh/${filename}`,
    });
  } catch (error) {
    res.status(500).json({
      status: "failure",
      error: "Error uploading image",
      details: (error as Error).message,
    });
  }
}
