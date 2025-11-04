import { NextResponse } from "next/server";

const APIFY_API_KEY = process.env.APIFY_API_KEY;

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

export async function POST(request: Request) {
  if (!APIFY_API_KEY) {
    return NextResponse.json(
      { error: "APIFY_API_KEY is not set" },
      { status: 500 },
    );
  }
  try {
    const { awemeId, profileUsername } = (await request.json()) as {
      awemeId?: string;
      profileUsername?: string | null;
    };

    if (!awemeId) {
      return NextResponse.json(
        { error: "Missing awemeId in request body" },
        { status: 400 },
      );
    }

    if (!profileUsername || !profileUsername.trim()) {
      return NextResponse.json(
        { error: "Missing profileUsername in request body" },
        { status: 400 },
      );
    }

    const trimmedProfileUsername = profileUsername.trim();
    const callApify = async (payload: Record<string, unknown>) => {
      const response = await fetch(
        `https://api.apify.com/v2/acts/scraptik~tiktok-api/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const json = await response.json();

      if (!response.ok) {
        return {
          error:
            json?.error ??
            json?.message ??
            "Apify request failed. Check the provided payload.",
          status: response.status,
          data: json,
        } as const;
      }

      const items = Array.isArray(json) ? json : [json];
      return { items, data: json } as const;
    };

    const accountFetch = await callApify({
      profile_username: trimmedProfileUsername,
    });

    if ("error" in accountFetch) {
      return NextResponse.json(
        { error: accountFetch.error, data: accountFetch.data },
        { status: accountFetch.status },
      );
    }

    const accountItems = accountFetch.items;
    const accountDetail = accountItems?.[0] ?? null;

    if (!accountDetail || typeof accountDetail !== "object") {
      return NextResponse.json(
        {
          error: "Unable to extract account detail from Apify response",
          data: accountFetch.data,
        },
        { status: 422 },
      );
    }

    const userProfile = accountDetail;

    const accountAvatarUrls: Array<unknown> = [
      ...(userProfile?.avatar_larger?.url_list ?? []),
      ...(userProfile?.avatar_300x300?.url_list ?? []),
      ...(userProfile?.avatar_medium?.url_list ?? []),
      ...(userProfile?.avatar_thumb?.url_list ?? []),
    ];
    const accountProfileImageUrl = pickFirstString(accountAvatarUrls);

    const accountUsername = (
      userProfile?.unique_id ??
      userProfile?.short_id ??
      trimmedProfileUsername
    )
      ?.toString()
      .trim();
    const accountDisplayName = (
      userProfile?.nickname ?? accountUsername
    )
      ?.toString()
      .trim();

    if (!accountUsername || !accountDisplayName) {
      return NextResponse.json(
        {
          error: "Missing username or display name in account response",
          data: accountFetch.data,
        },
        { status: 422 },
      );
    }

    const accountPayload = {
      username: accountUsername,
      displayName: accountDisplayName,
      bio:
        typeof userProfile?.signature === "string" &&
        userProfile.signature.trim().length
          ? userProfile.signature.trim()
          : undefined,
      profileImageUrl: accountProfileImageUrl ?? undefined,
      followerCount: toPositiveInt(userProfile?.follower_count),
      followingCount: toPositiveInt(userProfile?.following_count),
      isVerified: Boolean(
        userProfile?.verified ??
          userProfile?.custom_verify ??
          userProfile?.enterprise_verify_reason ??
          userProfile?.is_star,
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
        return NextResponse.json(
          {
            error:
              accountError?.error ??
              "Failed to create or resolve slideshow account",
            details: accountError,
            accountPayload,
          },
          { status: 500 },
        );
      }
    }

    if (!accountData?.id || typeof accountData.id !== "string") {
      return NextResponse.json(
        { error: "Could not resolve slideshow account identifier" },
        { status: 500 },
      );
    }

    const postFetch = await callApify({
      post_awemeId: awemeId,
      profile_username: trimmedProfileUsername,
    });

    if ("error" in postFetch) {
      return NextResponse.json(
        { error: postFetch.error, data: postFetch.data },
        { status: postFetch.status },
      );
    }

    const data = postFetch.data;

    const datasetItems = postFetch.items;
    const awemeDetail =
      findAwemeDetail(datasetItems) ?? datasetItems?.[0]?.aweme_detail;

    if (!awemeDetail || typeof awemeDetail !== "object") {
      return NextResponse.json(
        { error: "Could not locate aweme_detail in Apify response", data },
        { status: 422 },
      );
    }

    const author = (awemeDetail as any)?.author ?? userProfile ?? {};
    const statistics = (awemeDetail as any)?.statistics ?? {};
    const textExtra = Array.isArray((awemeDetail as any)?.text_extra)
      ? (awemeDetail as any).text_extra
      : [];

    const awemeIdFromDetail =
      (awemeDetail as any)?.aweme_id?.toString() ?? awemeId;
    const publishedAtSeconds = Number((awemeDetail as any)?.create_time ?? 0);
    const publishedAt = new Date(
      (Number.isFinite(publishedAtSeconds)
        ? publishedAtSeconds * 1000
        : Date.now()),
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
      categories: uniqueCategories.filter(
        (cat): cat is string => typeof cat === "string" && cat.length > 0,
      ),
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
        return NextResponse.json(
          {
            error:
              postError?.error ?? "Failed to create slideshow post",
            details: postError,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      request: {
        awemeId,
        profileUsername: trimmedProfileUsername,
      },
      raw: {
        account: accountFetch.data,
        post: data,
      },
      accountDetail: userProfile,
      awemeDetail,
      account: accountData,
      post: postData,
    });
  } catch (error) {
    console.error("Apify run failed", error);
    return NextResponse.json(
      { error: "Failed to trigger Apify run" },
      { status: 500 },
    );
  }
}
