import { execFile } from "child_process";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
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
    cachedFfmpegPath = requireFromNode<{ path: string }>(
      "@ffmpeg-installer/ffmpeg",
    ).path;
  }
  return cachedFfmpegPath;
};

const getFfprobePath = () => {
  if (!cachedFfprobePath) {
    cachedFfprobePath = requireFromNode<{ path: string }>(
      "@ffprobe-installer/ffprobe",
    ).path;
  }
  return cachedFfprobePath;
};

const runFfmpeg = async (args: string[]) => {
  try {
    const { stdout, stderr } = await execFileAsync(getFfmpegPath(), args, {
      windowsHide: true,
    });
    // viele Builds loggen nur auf stderr; zur Diagnose mehr Kontext anzeigen
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
    // args und letzter Teil des stderr mit ausgeben
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

/** Liefert true, wenn URL zur eigenen App gehört (localhost, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL, VERCEL_URL). */
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

/** Mappt URL/Pfad auf eine potentielle Datei unter /public und kopiert sie nach destinationPath. */
const tryCopyFromPublic = async (inputUrlOrPath: string, destinationPath: string) => {
  const pathname = /^https?:\/\//i.test(inputUrlOrPath)
    ? new URL(inputUrlOrPath).pathname
    : inputUrlOrPath;
  const relative = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const diskPath = join(process.cwd(), "public", relative);
  try {
    await fs.copyFile(diskPath, destinationPath);
    return;
  } catch (err: any) {
    // Zusätzlicher Versuch für gängige Monorepo-Struktur (optional, schadet nicht)
    const altDiskPath = join(process.cwd(), relative);
    try {
      await fs.copyFile(altDiskPath, destinationPath);
      return;
    } catch {
      const hint = `[UGC] File not found on disk. Tried: ${diskPath} and ${altDiskPath}`;
      throw new Error(hint);
    }
  }
};

const downloadToFile = async (url: string, filePath: string) => {
  // 1) App-interne oder relative URLs -> direkt von Disk lesen, um Auth-/HTML-Probleme zu vermeiden
  if (!/^https?:\/\//i.test(url) || isAppLocalUrl(url)) {
    await tryCopyFromPublic(url, filePath);
    return;
  }

  // 2) Extern (z. B. UploadThing) per fetch laden
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
    // Fallback auf public-Datei (falls die App URL geschützt ist)
    await tryCopyFromPublic(finalUrl, filePath);
    return;
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

  // Einheitliche 9:16-Normalisierung – sicher mit ganzzahligen Werten
  const filter = [
    // Skaliere Video proportional, sodass die Höhe exakt 1920 wird
    // Danach wird Breite auf 1080 gecroppt (kein Stretch, kein Padding)
    "scale=-1:1920:flags=lanczos",
    // Falls das Video schmaler oder breiter ist, auf 1080x1920 beschneiden
    "crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2",
    // Sicheres Seitenverhältnis & Farbraum
    "setsar=1",
    "fps=30",
    "format=yuv420p"
  ].join(",");

  // 🧩 Final fix: filter nach allen Inputs mit -filter_complex anwenden (robust & korrekt)
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
    await fs.copyFile(single.path, destinationPath);
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
  overlayText?: string;
  overlayPosition?: "upper" | "middle";
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

    const concatenatedPath = join(tempDir, `ugc-final-${randomUUID()}.mp4`);
    const totalDurationMs = await concatVideos(
      demoNormalized
        ? [reactionNormalized, demoNormalized]
        : [reactionNormalized],
      concatenatedPath,
    );

    // Optional: Hook-Text wie in der Preview einbrennen
    let finalVideoPath = concatenatedPath;
    if (overlayText && overlayText.trim().length > 0) {
      const outPath = join(tempDir, `ugc-final-overlay-${randomUUID()}.mp4`);
      const fontCandidates = [
        join(process.cwd(), "src", "fonts", "tiktok", "TikTokTextBold.otf"),
        join(process.cwd(), "src", "fonts", "TikTokTextBold.otf"),
        join(process.cwd(), "public", "fonts", "TikTokTextBold.otf"),
      ];
      let fontArg: string[] = [];
      for (const p of fontCandidates) {
        try {
          await fs.stat(p);
          fontArg = [":fontfile=" + p.replace(/\\/g, "\\\\")];
          break;
        } catch {}
      }
      // Positionierung: upper ≈ 18% von oben, middle = Vertikalmitte
      const yExprRaw =
        overlayPosition === "middle"
          ? "(h-text_h)/2"
          : "max((h*0.18)-(text_h/2),20)"; // ohne Leerzeichen
      // In älteren FFmpeg-Builds müssen Kommas in Ausdrücken geescaped werden
      const yExprEsc = yExprRaw.replace(/,/g, "\\,");

      // drawtext benötigt Escapes für \ : ' %
      const escapeDrawtext = (s: string) =>
        s
          .replace(/\\/g, "\\\\")
          .replace(/:/g, "\\:")
          .replace(/'/g, "\\'")
          .replace(/%/g, "\\%");
      const text = escapeDrawtext(overlayText);
      // Korrekt: fontArg anhängen (nicht ".fontArg")
      const draw = [
        `drawtext=text='${text}'`,
        fontArg.join(""),
        ":fontsize=54",
        ":fontcolor=white",
        ":x=(w-text_w)/2",
        `:y=${yExprEsc}`,
        ":borderw=3:bordercolor=black",
        ":shadowx=2:shadowy=2:shadowcolor=black@0.65",
      ].join("");
      console.debug("[UGC][ffmpeg] using -vf:", draw);
      await runFfmpeg([
        "-y",
        "-i",
        concatenatedPath,
        "-vf",
        draw,
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
