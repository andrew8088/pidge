import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
const pidgeSecret = process.env.PIDGE_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log(req.body);

  const { fileType, fileName, metadata, secret } = req.body;

  if (secret !== pidgeSecret) {
    return res
      .status(400)
      .json({ status: "failure", error: "secret incorrect" });
  }

  if (!fileType || !fileName) {
    return res
      .status(400)
      .json({ status: "failure", error: "Image and filename are required" });
  }

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    return res
      .status(500)
      .json({ status: "failure", error: "missing environment variables" });
  }
  let parsedMetadata = {};
  if (metadata) {
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (error) {
      return res.status(400).json({
        status: "failure",
        error: "Invalid metadata format. Should be a JSON object.",
      });
    }
  }

  const s3 = new S3Client({
    region,
    credentials: {
      secretAccessKey,
      accessKeyId,
    },
  });

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      ContentType: fileType,
      Metadata: metadata,
    });

    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 120 });

    res.status(200).json({
      status: "success",
      data: uploadURL,
      url: `https://media.shaky.sh/${fileName}`,
    });
  } catch (error) {
    res.status(500).json({
      status: "failure",
      error: "Error uploading image",
      details: (error as Error).message,
    });
  }
}
