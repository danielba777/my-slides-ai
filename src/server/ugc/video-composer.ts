import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { execFile } from "child_process";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { promisify } from "util";

import { UTFile } from "uploadthing/server";

import { utapi } from "@/app/api/uploadthing/core";

const execFileAsync = promisify(execFile);

const requireFromNode = <T>(moduleId: string): T => {
  const nodeRequire = eval("require") as NodeJS.Require;
  return nodeRequire(moduleId) as T;
};

let cachedFfmpegPath: string | null = null;
let cachedFfprobePath: string | null = null;

const getFfmpegPath = () => {
  if (!cachedFfmpegPath) {
    cachedFfmpegPath = requireFromNode<{ path: string }>("@ffmpeg-installer/ffmpeg").path;
  }
  return cachedFfmpegPath;
};

const getFfprobePath = () => {
  if (!cachedFfprobePath) {
    cachedFfprobePath = requireFromNode<{ path: string }>("@ffprobe-installer/ffprobe").path;
  }
  return cachedFfprobePath;
};

const runFfmpeg = async (args: string[]) => {
  try {
    await execFileAsync(getFfmpegPath(), args, { windowsHide: true });
  } catch (error) {
    console.error("[UGC][ffmpeg] Command failed", { args, error });
    throw new Error("Video processing failed");
  }
};

const runFfprobe = async (args: string[]) => {
  try {
    const { stdout } = await execFileAsync(getFfprobePath(), args, {
      windowsHide: true,
    });
    return stdout;
  } catch (error) {
    console.error("[UGC][ffprobe] Command failed", { args, error });
    throw new Error("Video inspection failed");
  }
};

const downloadToFile = async (url: string, filePath: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
};

const probeVideo = async (filePath: string) => {
  const stdout = await runFfprobe([
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_streams",
    "-show_format",
    filePath,
  ]);

  const metadata = JSON.parse(stdout) as {
    streams?: Array<{ codec_type?: string }>;
    format?: { duration?: string };
  };

  const hasAudio =
    Array.isArray(metadata.streams) &&
    metadata.streams.some((stream) => stream.codec_type === "audio");

  const durationSeconds = metadata.format?.duration
    ? Number.parseFloat(metadata.format.duration)
    : 0;

  const durationMs = Number.isFinite(durationSeconds)
    ? Math.max(Math.round(durationSeconds * 1000), 0)
    : 0;

  return { hasAudio, durationMs };
};

type NormalizedVideo = {
  path: string;
  durationMs: number;
};

const normalizeVideo = async (
  sourcePath: string,
  destinationPath: string,
): Promise<NormalizedVideo> => {
  const { hasAudio, durationMs } = await probeVideo(sourcePath);
  const args: string[] = ["-y"];

  if (!hasAudio) {
    const durationSeconds = Math.max(durationMs / 1000, 0.1);
    args.push(
      "-f",
      "lavfi",
      "-i",
      `anullsrc=channel_layout=stereo:sample_rate=44100:d=${durationSeconds.toFixed(3)}`,
    );
  }

  args.push("-i", sourcePath);

  if (!hasAudio) {
    args.push("-map", "1:v:0", "-map", "0:a:0");
  } else {
    args.push("-map", "0:v:0", "-map", "0:a:0");
  }

  args.push(
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-ac",
    "2",
    "-ar",
    "44100",
  );

  if (!hasAudio) {
    args.push("-shortest");
  }

  args.push(destinationPath);

  await runFfmpeg(args);
  return { path: destinationPath, durationMs };
};

const concatVideos = async (inputs: NormalizedVideo[], destinationPath: string) => {
  if (inputs.length === 0) {
    throw new Error("No videos provided for concatenation");
  }

  if (inputs.length === 1) {
    const [single] = inputs;
    if (!single) {
      throw new Error("Missing normalized video input");
    }
    await fs.copyFile(single.path, destinationPath);
    return single.durationMs;
  }

  const folder = dirname(destinationPath);
  const listPath = join(folder, `concat-${randomUUID()}.txt`);
  const listContent = inputs
    .map((input) => `file '${input.path.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(listPath, listContent, "utf8");

  try {
    await runFfmpeg([
      "-y",
      "-safe",
      "0",
      "-f",
      "concat",
      "-i",
      listPath,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      destinationPath,
    ]);
  } finally {
    await fs.unlink(listPath).catch(() => {});
  }

  const totalDuration = inputs.reduce((acc, item) => acc + item.durationMs, 0);
  return totalDuration;
};

const captureThumbnail = async (videoPath: string, destinationPath: string) => {
  await runFfmpeg([
    "-y",
    "-i",
    videoPath,
    "-ss",
    "0",
    "-frames:v",
    "1",
    destinationPath,
  ]);
};

const uploadBuffer = async (buffer: Buffer, fileName: string) => {
  const utFile = new UTFile([new Uint8Array(buffer)], fileName);
  const [upload] = await utapi.uploadFiles([utFile]);
  if (!upload?.data?.ufsUrl) {
    throw new Error("UploadThing upload failed");
  }
  return upload.data.ufsUrl;
};

export interface ComposeOptions {
  reactionUrl: string;
  demoUrl?: string | null;
  userId: string;
}

export interface ComposeResult {
  videoUrl: string;
  thumbnailUrl?: string;
  durationMs: number;
}

export async function composeReactionDemoVideo({
  reactionUrl,
  demoUrl,
  userId,
}: ComposeOptions): Promise<ComposeResult> {
  const tempDir = await fs.mkdtemp(join(tmpdir(), "ugc-compose-"));

  try {
    const reactionSource = join(tempDir, `reaction-${randomUUID()}.mp4`);
    await downloadToFile(reactionUrl, reactionSource);

    const reactionNormalized = await normalizeVideo(
      reactionSource,
      join(tempDir, `reaction-normalized-${randomUUID()}.mp4`),
    );

    let demoNormalized: NormalizedVideo | null = null;
    if (demoUrl) {
      const demoSource = join(tempDir, `demo-${randomUUID()}.mp4`);
      await downloadToFile(demoUrl, demoSource);
      demoNormalized = await normalizeVideo(
        demoSource,
        join(tempDir, `demo-normalized-${randomUUID()}.mp4`),
      );
    }

    const finalVideoPath = join(tempDir, `ugc-final-${randomUUID()}.mp4`);
    const totalDurationMs = await concatVideos(
      demoNormalized ? [reactionNormalized, demoNormalized] : [reactionNormalized],
      finalVideoPath,
    );

    const thumbnailPath = join(tempDir, `ugc-thumb-${randomUUID()}.jpg`);
    await captureThumbnail(finalVideoPath, thumbnailPath);

    const [videoBuffer, thumbnailBuffer] = await Promise.all([
      fs.readFile(finalVideoPath),
      fs.readFile(thumbnailPath),
    ]);

    // Speichere geordnet unter: ugc/hooks/default/<userId>/<timestamp>
    const timestamp = Date.now();
    const prefix = `ugc/hooks/default/${userId}/${timestamp}`;

    const [videoUrlUploaded, thumbnailUrlUploaded] = await Promise.all([
      uploadBuffer(videoBuffer, `${prefix}.mp4`),
      uploadBuffer(thumbnailBuffer, `${prefix}.jpg`),
    ]);

    return {
      videoUrl: videoUrlUploaded,
      thumbnailUrl: thumbnailUrlUploaded,
      durationMs: totalDurationMs,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
