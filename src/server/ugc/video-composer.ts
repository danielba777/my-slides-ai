import { execFile } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs";
import { promises as fsAsync } from "fs";
import { tmpdir } from "os";
import { dirname, join, basename } from "path";
import { promisify } from "util";

import { UTFile } from "uploadthing/server";

import { utapi } from "@/app/api/uploadthing/core";

const execFileAsync = promisify(execFile);

const requireFromNode = <T>(moduleId: string): T => {
  const nodeRequire = eval("require") as NodeJS.Require;
  return nodeRequire(moduleId) as T;
};


function ensureExecutable(tempKey: "ffmpeg" | "ffprobe", sourcePath: string): string {
  try {
    
    fs.accessSync(sourcePath, fs.constants.X_OK);
    return sourcePath;
  } catch {
    
  }
  const fileName = `${tempKey}-${basename(sourcePath)}`;
  const targetDir = join(tmpdir(), "slidescockpit-binaries");
  const targetPath = join(targetDir, fileName);
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    
    let needsCopy = true;
    try {
      const [srcStat, dstStat] = [fs.statSync(sourcePath), fs.statSync(targetPath)];
      if (srcStat.size === dstStat.size) needsCopy = false;
    } catch {
      
    }
    if (needsCopy) {
      fs.copyFileSync(sourcePath, targetPath);
    }
    fs.chmodSync(targetPath, 0o755);
    return targetPath;
  } catch (err) {
    
    console.warn(`[UGC][binaries] Failed to stage ${tempKey} to tmp:`, err);
    return sourcePath;
  }
}

let cachedFfmpegPath: string | null = null;
let cachedFfprobePath: string | null = null;

const getFfmpegPath = () => {
  if (!cachedFfmpegPath) {
    const pkgPath = requireFromNode<{ path: string }>(
      "@ffmpeg-installer/ffmpeg",
    ).path;
    cachedFfmpegPath = ensureExecutable("ffmpeg", pkgPath);
  }
  return cachedFfmpegPath;
};

const getFfprobePath = () => {
  if (!cachedFfprobePath) {
    const pkgPath = requireFromNode<{ path: string }>(
      "@ffprobe-installer/ffprobe",
    ).path;
    cachedFfprobePath = ensureExecutable("ffprobe", pkgPath);
  }
  return cachedFfprobePath;
};


function normalizeForFfmpegFontfile(p: string) {
  let out = p.replace(/\\/g, "/");
  out = out.replace(/^([A-Za-z]):\//, "$1\\:/");
  return out;
}

function resolveTikTokFontPath(): string | null {
  
  const envPath = process.env.TIKTOK_FONT_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const candidates = [
    
    join(process.cwd(), "src", "app", "fonts", "tiktok", "TikTokTextBold.otf"),
    
    join(process.cwd(), "src", "fonts", "tiktok", "TikTokTextBold.otf"),
    join(process.cwd(), "src", "fonts", "TikTokTextBold.otf"),
    join(process.cwd(), "public", "fonts", "TikTokTextBold.otf"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const runFfmpeg = async (args: string[]) => {
  try {
    const { stdout, stderr } = await execFileAsync(getFfmpegPath(), args, {
      windowsHide: true,
    });
    
    if (stderr && stderr.trim().length > 0) {
      const tail = stderr.split("\n").slice(-30).join("\n");
      console.debug("[UGC][ffmpeg] tail stderr:\n" + tail);
    }
    if (stdout && stdout.trim().length > 0) {
      const tail = stdout.split("\n").slice(-10).join("\n");
      console.debug("[UGC][ffmpeg] tail stdout:\n" + tail);
    }
  } catch (error: any) {
    const rawStderr = (error?.stderr && String(error.stderr)) || "";
    const rawMsg =
      rawStderr ||
      (error?.message && String(error.message)) ||
      "Video processing failed";
    const trimmed =
      rawStderr.length > 4000 ? rawStderr.slice(-4000) : rawStderr;
    
    console.error("[UGC][ffmpeg] Command failed", {
      args,
      error: rawMsg,
      stderrTail: trimmed.split("\n").slice(-50).join("\n"),
    });
    throw new Error(
      rawMsg.includes("Error") ? rawMsg : `Video processing failed: ${rawMsg}`,
    );
  }
};

const runFfprobe = async (args: string[]) => {
  try {
    const { stdout, stderr } = await execFileAsync(getFfprobePath(), args, {
      windowsHide: true,
    });
    if (stderr && stderr.trim().length > 0) {
      console.debug("[UGC][ffprobe] stderr:", stderr.split("\n").slice(-6).join("\n"));
    }
    return stdout;
  } catch (error: any) {
    const msg =
      (error?.stderr && String(error.stderr)) ||
      (error?.message && String(error.message)) ||
      "Video inspection failed";
    console.error("[UGC][ffprobe] Command failed", { args, error: msg });
    throw new Error(msg.includes("Error") ? msg : `Video inspection failed: ${msg}`);
  }
};

const toAbsoluteUrl = (maybeUrl: string): string => {
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return new URL(maybeUrl, base).toString();
};


const isAppLocalUrl = (inputUrl: string) => {
  try {
    const abs = toAbsoluteUrl(inputUrl);
    const u = new URL(abs);
    const ownHosts = new Set<string>();
    [
      process.env.NEXTAUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      "http://localhost:3000",
    ]
      .filter(Boolean)
      .forEach((b) => {
        try {
          const bu = new URL(b as string);
          ownHosts.add(`${bu.protocol}//${bu.host}`);
        } catch {}
      });
    return ownHosts.has(`${u.protocol}//${u.host}`);
  } catch {
    return false;
  }
};


const tryCopyFromPublic = async (inputUrlOrPath: string, destinationPath: string) => {
  const pathname = /^https?:\/\//i.test(inputUrlOrPath)
    ? new URL(inputUrlOrPath).pathname
    : inputUrlOrPath;
  const relative = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const diskPath = join(process.cwd(), "public", relative);
  try {
    await fsAsync.copyFile(diskPath, destinationPath);
    return;
  } catch (err: any) {
    
    const altDiskPath = join(process.cwd(), relative);
    try {
      await fsAsync.copyFile(altDiskPath, destinationPath);
      return;
    } catch {
      const hint = `[UGC] File not found on disk. Tried: ${diskPath} and ${altDiskPath}`;
      throw new Error(hint);
    }
  }
};

const downloadToFile = async (url: string, filePath: string) => {
  if (!/^https?:\/\//i.test(url) || isAppLocalUrl(url)) {
    await tryCopyFromPublic(url, filePath);
    return;
  }

  
  const absolute = toAbsoluteUrl(url);
  const response = await fetch(absolute, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to download ${absolute}: ${response.status} ${response.statusText}`);
  }
  const ct = (response.headers.get("content-type") || "").toLowerCase();
  const finalUrl = response.url || absolute;
  const looksLikeHtml = ct.includes("text/html");
  const looksLikeSignin = finalUrl.includes("/auth/signin");
  if (looksLikeHtml || looksLikeSignin) {
    
    await tryCopyFromPublic(finalUrl, filePath);
    return;
  }
  const arrayBuffer = await response.arrayBuffer();
  await fsAsync.writeFile(filePath, Buffer.from(arrayBuffer));
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

  
  const filter = [
    
    
    "scale=-1:1920:flags=lanczos",
    
    "crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2",
    
    "setsar=1",
    "fps=30",
    "format=yuv420p"
  ].join(",");

  
  if (hasAudio) {
    args.push(
      "-i",
      sourcePath,
      "-filter_complex",
      `[0:v]${filter}[v]`,
      "-map",
      "[v]",
      "-map",
      "0:a?",
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
      destinationPath
    );
  } else {
    const durationSeconds = Math.max(durationMs / 1000, 0.1);
    args.push(
      "-i",
      sourcePath,
      "-f",
      "lavfi",
      "-t",
      durationSeconds.toFixed(3),
      "-i",
      "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-filter_complex",
      `[0:v]${filter}[v]`,
      "-map",
      "[v]",
      "-map",
      "1:a",
      "-shortest",
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
      destinationPath
    );
  }

  await runFfmpeg(args);
  return { path: destinationPath, durationMs };
};

const concatVideos = async (
  inputs: NormalizedVideo[],
  destinationPath: string,
) => {
  if (inputs.length === 0) {
    throw new Error("No videos provided for concatenation");
  }

  if (inputs.length === 1) {
    const [single] = inputs;
    if (!single) {
      throw new Error("Missing normalized video input");
    }
    await fsAsync.copyFile(single.path, destinationPath);
    return single.durationMs;
  }

  const folder = dirname(destinationPath);
  const listPath = join(folder, `concat-${randomUUID()}.txt`);
  const listContent = inputs
    .map(
      (input) =>
        `file '${input.path.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`,
    )
    .join("\n");
  await fsAsync.writeFile(listPath, listContent, "utf8");

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
    await fsAsync.unlink(listPath).catch(() => {});
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

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const uploadBuffer = async (buf: Buffer, key: string, mimeType: string = "video/mp4"): Promise<string> => {
  
  const extension = mimeType === "video/mp4" ? ".mp4" : ".jpg";
  const filename = `${key}${extension}`;
  
  
  const utFile = new UTFile([new Uint8Array(buf)], filename, { type: mimeType });

  
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const [upload] = await utapi.uploadFiles([utFile]);
      if (upload?.data?.ufsUrl) {
        return upload.data.ufsUrl;
      }
      const msg = upload?.error ?? "UploadThing upload failed";
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } catch (err: any) {
      const message = String(err?.message ?? err);
      const shouldRetry =
        message.includes("ResourceExhausted") ||
        message.includes("connection limit exceeded") ||
        message.includes("rate limit") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT") ||
        message.includes("5") || 
        message.includes("429");

      if (attempt < maxAttempts && shouldRetry) {
        const jitter = Math.floor(Math.random() * 400);
        const backoff = Math.min(2000 * 2 ** (attempt - 1) + jitter, 15000);
        console.warn(
          `[UGC][upload] Attempt ${attempt}/${maxAttempts} failed: ${message}. Retrying in ${backoff}ms…`
        );
        await sleep(backoff);
        continue;
      }
      console.error("[UGC][upload] Permanent failure:", message);
      throw new Error("UploadThing upload failed");
    }
  }
  
  throw new Error("UploadThing upload failed");
};

export interface ComposeOptions {
  reactionUrl: string;
  demoUrl?: string | null;
  userId: string;
  overlayText?: string;
  overlayPosition?: "upper" | "middle";
  soundUrl?: string; 
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
  overlayText,
  overlayPosition = "upper",
  soundUrl,
}: ComposeOptions): Promise<ComposeResult> {
  const tempDir = await fsAsync.mkdtemp(join(tmpdir(), "ugc-compose-"));
  let bgmTempPath: string | null = null;

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

    const concatenatedPath = join(tempDir, `ugc-final-${randomUUID()}.mp4`);
    const totalDurationMs = await concatVideos(
      demoNormalized
        ? [reactionNormalized, demoNormalized]
        : [reactionNormalized],
      concatenatedPath,
    );

    
    let finalVideoPath = concatenatedPath;
    if (overlayText && overlayText.trim().length > 0) {
      const outPath = join(tempDir, `ugc-final-overlay-${randomUUID()}.mp4`);
      const resolvedFontPath = resolveTikTokFontPath();
      if (!resolvedFontPath) {
        console.warn("[UGC][compose] TikTok font NOT FOUND – FFmpeg will fallback. Check font path packaging.");
      } else {
        console.log("[UGC][compose] Using TikTok font:", resolvedFontPath);
      }
      
      const yExprRaw =
        overlayPosition === "middle"
          ? "(h-text_h)/2"
          : "max((h*0.18)-(text_h/2),20)"; 
      
      const yExprEsc = yExprRaw.replace(/,/g, "\\,");

  
      const OUTPUT_WIDTH = 1080;
      const OUTPUT_HEIGHT = 1920;
      const scaleFactor = OUTPUT_HEIGHT / 1920; 
      const fontSizePx = Math.round(54 * scaleFactor);
      const borderW = Math.max(1, Math.round(3 * scaleFactor));
      const shadowOff = Math.max(1, Math.round(2 * scaleFactor));

      const ffFontfile = resolvedFontPath
        ? `:fontfile='${normalizeForFfmpegFontfile(resolvedFontPath)}'`
        : "";
      const ffFontsize = `:fontsize=${fontSizePx}`;
      const ffBorder = `:bordercolor=black:borderw=${borderW}`;
      const ffShadow = `:shadowcolor=black@0.65:shadowx=${shadowOff}:shadowy=${shadowOff}`;

      
      const escapeDrawtext = (s: string) =>
        s
          .replace(/\\/g, "\\\\")
          .replace(/:/g, "\\:")
          .replace(/'/g, "\\'")
          .replace(/%/g, "\\%");
      const escapedText = escapeDrawtext(overlayText);
      const drawText = `drawtext=text='${escapedText}'${ffFontfile}:fontcolor=white${ffFontsize}${ffBorder}${ffShadow}:x=(w-text_w)/2:y=${yExprEsc}:line_spacing=0:fix_bounds=1`;
      console.debug("[UGC][ffmpeg] using -vf:", drawText);
      await runFfmpeg([
        "-y",
        "-i",
        concatenatedPath,
        "-vf",
        drawText,
        "-c:v",
        "libx264",
        "-crf",
        "22",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        outPath,
      ]);
      finalVideoPath = outPath;
    }

    const thumbnailPath = join(tempDir, `ugc-thumb-${randomUUID()}.jpg`);
    await captureThumbnail(finalVideoPath, thumbnailPath);

    // AUDIO HANDLING: Original-Audio durch gewählten Sound ersetzen
    let finalVideoWithSoundPath = finalVideoPath;

    // Default-Sound aus ENV, falls keiner im Body:
    const effectiveSoundUrl =
      soundUrl?.trim() ||
      process.env.DEFAULT_SOUND_URL?.trim() ||
      "";

    if (effectiveSoundUrl) {
      try {
        // Audio-Datei lokal puffern (stabil für ffmpeg -i)
        const res = await fetch(effectiveSoundUrl);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          bgmTempPath = join(tempDir, `ugc-bgm-${randomUUID()}.mp3`);
          await fsAsync.writeFile(bgmTempPath, Buffer.from(arrayBuf));

          // Neues Video mit Sound erstellen
          const videoWithSoundPath = join(tempDir, `ugc-final-with-sound-${randomUUID()}.mp4`);
          await runFfmpeg([
            "-y",
            "-i", finalVideoPath,     // Video ohne Audio
            "-i", bgmTempPath,       // BGM Audio
            "-map", "0:v:0",         // Nur Video von Input #0
            "-map", "1:a:0",         // Nur Audio von Input #1
            "-shortest",             // Kürzeste Länge verwenden
            "-c:v", "copy",          // Video-Stream kopieren
            "-c:a", "aac",           // Audio neu kodieren
            "-b:a", "192k",
            "-movflags", "+faststart",
            videoWithSoundPath,
          ]);
          finalVideoWithSoundPath = videoWithSoundPath;
          console.log("[UGC][compose] Using background sound:", effectiveSoundUrl);
        } else {
          console.warn("[UGC][compose] Failed to fetch soundUrl:", effectiveSoundUrl, res.status);
        }
      } catch (err) {
        console.error("[UGC][compose] Error processing sound:", err);
      }
    } else {
      console.log("[UGC][compose] No sound provided, creating silent video");
    }

    const [videoBuffer, thumbnailBuffer] = await Promise.all([
      fsAsync.readFile(finalVideoWithSoundPath),
      fsAsync.readFile(thumbnailPath),
    ]);

    // Speichere geordnet unter: ugc/hooks/default/<userId>/<timestamp>
    const timestamp = Date.now();
    const prefix = `ugc/hooks/default/${userId}/${timestamp}`;

    const [videoUrlUploaded, thumbnailUrlUploaded] = await Promise.all([
      uploadBuffer(videoBuffer, `${prefix}`, "video/mp4"),
      uploadBuffer(thumbnailBuffer, `${prefix}`, "image/jpeg"),
    ]);

    return {
      videoUrl: videoUrlUploaded,
      thumbnailUrl: thumbnailUrlUploaded,
      durationMs: totalDurationMs,
    };
  } finally {
    // Aufräumen: temporäre BGM-Datei entfernen
    if (bgmTempPath) {
      try { await fsAsync.unlink(bgmTempPath); } catch {}
    }
    await fsAsync.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
