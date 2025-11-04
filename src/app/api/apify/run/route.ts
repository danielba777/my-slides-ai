import { NextResponse } from "next/server";

if (!process.env.APIFY_API_KEY) {
  throw new Error("APIFY_API_KEY is not set");
}

const API_BASE_URL =
  process.env.SLIDESCOCKPIT_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

const toPositiveInt = (value: unknown) => {
  const maybeNumber = Number(value);
  if (!Number.isFinite(maybeNumber) || Number.isNaN(maybeNumber)) {
    return 0;
  }
  return Math.max(0, Math.round(maybeNumber));
};

export class ApifyIngestError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status = 500, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function findAwemeDetail(source: unknown): any | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  if (
    Object.prototype.hasOwnProperty.call(source, "aweme_detail") &&
    (source as Record<string, unknown>).aweme_detail
  ) {
    return (source as Record<string, unknown>).aweme_detail;
  }

  for (const value of Object.values(source)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const result = findAwemeDetail(item);
        if (result) return result;
      }
    } else if (value && typeof value === "object") {
      const result = findAwemeDetail(value);
      if (result) return result;
    }
  }

  return null;
}

function pickFirstString(values: unknown): string | undefined {
  if (!values) return undefined;
  if (typeof values === "string") {
    return values.trim().length > 0 ? values : undefined;
  }
  if (Array.isArray(values)) {
    for (const item of values) {
      if (typeof item === "string" && item.trim().length > 0) {
        return item;
      }
    }
  }
  return undefined;
}

async function callApify(payload: Record<string, unknown>) {
  const response = await fetch(
    `https://api.apify.com/v2/acts/scraptik~tiktok-api/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const json = await response.json();

  if (!response.ok) {
    throw new ApifyIngestError(
      json?.error ??
        json?.message ??
        "Apify request failed. Check the provided payload.",
      response.status,
      json,
    );
  }

  const items = Array.isArray(json) ? json : [json];
  return { items, raw: json };
}

export async function ingestTikTokPost({
  awemeId,
  profileUsername,
}: {
  awemeId: string;
  profileUsername: string;
}) {
  const trimmedProfileUsername = profileUsername.trim();

  const accountFetch = await callApify({
    profile_username: trimmedProfileUsername,
  });

  const accountDetail = accountFetch.items?.[0] ?? null;

  if (!accountDetail || typeof accountDetail !== "object") {
    throw new ApifyIngestError(
      "Unable to extract account detail from Apify response",
      422,
      accountFetch.raw,
    );
  }

  const accountAvatarUrls: Array<unknown> = [
    ...(accountDetail?.avatar_larger?.url_list ?? []),
    ...(accountDetail?.avatar_300x300?.url_list ?? []),
    ...(accountDetail?.avatar_medium?.url_list ?? []),
    ...(accountDetail?.avatar_thumb?.url_list ?? []),
  ];
  const accountProfileImageUrl = pickFirstString(accountAvatarUrls);

  const accountUsername = (
    accountDetail?.unique_id ??
    accountDetail?.short_id ??
    trimmedProfileUsername
  )
    ?.toString()
    .trim();
  const accountDisplayName = (accountDetail?.nickname ?? accountUsername)
    ?.toString()
    .trim();

  if (!accountUsername || !accountDisplayName) {
    throw new ApifyIngestError(
      "Missing username or display name in account response",
      422,
      accountFetch.raw,
    );
  }

  const accountPayload = {
    username: accountUsername,
    displayName: accountDisplayName,
    bio:
      typeof accountDetail?.signature === "string" &&
      accountDetail.signature.trim().length
        ? accountDetail.signature.trim()
        : undefined,
    profileImageUrl: accountProfileImageUrl ?? undefined,
    followerCount: toPositiveInt(accountDetail?.follower_count),
    followingCount: toPositiveInt(accountDetail?.following_count),
    isVerified: Boolean(
      accountDetail?.verified ??
        accountDetail?.custom_verify ??
        accountDetail?.enterprise_verify_reason ??
        accountDetail?.is_star,
    ),
  };

  let accountResponse = await fetch(
    `${API_BASE_URL}/slideshow-library/accounts`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountPayload),
    },
  );

  let accountData: any = null;
  if (accountResponse.ok) {
    accountData = await accountResponse.json();
  } else {
    const accountError = await accountResponse.json().catch(() => ({}));
    const duplicate =
      accountResponse.status === 409 ||
      (typeof accountError?.error === "string" &&
        accountError.error.toLowerCase().includes("unique constraint"));

    if (duplicate) {
      const existingAccountsResponse = await fetch(
        `${API_BASE_URL}/slideshow-library/accounts`,
        { cache: "no-store" },
      );
      if (existingAccountsResponse.ok) {
        const existingAccounts = await existingAccountsResponse.json();
        const accountsArray = Array.isArray(existingAccounts)
          ? existingAccounts
          : Array.isArray(existingAccounts?.data)
            ? existingAccounts.data
            : [];
        accountData = accountsArray.find(
          (account: any) => account.username === accountPayload.username,
        );
      }
    }

    if (!accountData) {
      throw new ApifyIngestError(
        accountError?.error ??
          "Failed to create or resolve slideshow account",
        500,
        {
          details: accountError,
          accountPayload,
        },
      );
    }
  }

  if (!accountData?.id || typeof accountData.id !== "string") {
    throw new ApifyIngestError(
      "Could not resolve slideshow account identifier",
      500,
      accountData,
    );
  }

  const postFetch = await callApify({
    post_awemeId: awemeId,
    profile_username: trimmedProfileUsername,
  });

  const datasetItems = postFetch.items;
  const awemeDetail =
    findAwemeDetail(datasetItems) ?? datasetItems?.[0]?.aweme_detail;

  if (!awemeDetail || typeof awemeDetail !== "object") {
    throw new ApifyIngestError(
      "Could not locate aweme_detail in Apify response",
      422,
      postFetch.raw,
    );
  }

  const author = (awemeDetail as any)?.author ?? accountDetail ?? {};
  const statistics = (awemeDetail as any)?.statistics ?? {};
  const textExtra = Array.isArray((awemeDetail as any)?.text_extra)
    ? (awemeDetail as any).text_extra
    : [];

  const awemeIdFromDetail =
    (awemeDetail as any)?.aweme_id?.toString() ?? awemeId;
  const publishedAtSeconds = Number((awemeDetail as any)?.create_time ?? 0);
  const publishedAt = new Date(
    Number.isFinite(publishedAtSeconds) && publishedAtSeconds > 0
      ? publishedAtSeconds * 1000
      : Date.now(),
  );

  const categories = textExtra
    .map((item: any) => item?.hashtag_name ?? item?.hashtag_name_with_symbol)
    .filter((value: unknown): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const uniqueCategories = Array.from(
    new Map(
      categories.map((cat) => [cat.toLowerCase(), cat] as [string, string]),
    ).values(),
  ).filter(
    (cat): cat is string => typeof cat === "string" && cat.length > 0,
  );

  const video = (awemeDetail as any)?.video ?? {};
  const coverImage =
    pickFirstString(video?.cover?.url_list) ??
    pickFirstString(video?.dynamic_cover?.url_list) ??
    pickFirstString(video?.origin_cover?.url_list);

  const durationMs = Number(video?.duration ?? 0);
  const durationSeconds =
    Number.isFinite(durationMs) && durationMs > 0
      ? Math.round(durationMs / 1000)
      : undefined;

  const slidesPayload = coverImage
    ? [
        {
          slideIndex: 0,
          imageUrl: coverImage,
          duration: durationSeconds ?? 3,
        },
      ]
    : [];

  const postPayload = {
    accountId: accountData.id,
    postId: awemeIdFromDetail,
    caption: (awemeDetail as any)?.desc ?? null,
    categories: uniqueCategories,
    likeCount: toPositiveInt(statistics?.digg_count),
    viewCount: toPositiveInt(statistics?.play_count),
    commentCount: toPositiveInt(statistics?.comment_count),
    shareCount: toPositiveInt(statistics?.share_count),
    publishedAt: publishedAt.toISOString(),
    createdAt: publishedAt.toISOString(),
    duration: durationSeconds,
    slides: slidesPayload,
  };

  let postData: any = null;
  const postResponse = await fetch(
    `${API_BASE_URL}/slideshow-library/posts`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postPayload),
    },
  );

  if (postResponse.ok) {
    postData = await postResponse.json();
  } else {
    const postError = await postResponse.json().catch(() => ({}));
    const duplicatePost =
      postResponse.status === 409 ||
      (typeof postError?.error === "string" &&
        postError.error.toLowerCase().includes("unique constraint"));

    if (duplicatePost) {
      const existingPostsResponse = await fetch(
        `${API_BASE_URL}/slideshow-library/accounts/${accountData.id}/posts?limit=200`,
        { cache: "no-store" },
      );
      if (existingPostsResponse.ok) {
        const existingPosts = await existingPostsResponse.json();
        const postsArray = Array.isArray(existingPosts)
          ? existingPosts
          : Array.isArray(existingPosts?.data)
            ? existingPosts.data
            : [];
        postData = postsArray.find(
          (post: any) => post.postId === postPayload.postId,
        );
      }
    }

    if (!postData) {
      throw new ApifyIngestError(
        postError?.error ?? "Failed to create slideshow post",
        500,
        postError,
      );
    }
  }

  return {
    request: {
      awemeId,
      profileUsername: trimmedProfileUsername,
    },
    raw: {
      account: accountFetch.raw,
      post: postFetch.raw,
    },
    accountDetail,
    awemeDetail,
    account: accountData,
    post: postData,
  };
}

export async function POST(request: Request) {
  try {
    const { awemeId, profileUsername } = (await request.json()) as {
      awemeId?: string;
      profileUsername?: string | null;
    };

    if (!awemeId) {
      throw new ApifyIngestError("Missing awemeId in request body", 400);
    }

    if (!profileUsername || !profileUsername.trim()) {
      throw new ApifyIngestError(
        "Missing profileUsername in request body",
        400,
      );
    }

    const result = await ingestTikTokPost({
      awemeId,
      profileUsername: profileUsername.trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApifyIngestError) {
      return NextResponse.json(
        { error: error.message, data: error.payload },
        { status: error.status },
      );
    }

    console.error("Apify run failed", error);
    return NextResponse.json(
      { error: "Failed to trigger Apify run" },
      { status: 500 },
    );
  }
}
