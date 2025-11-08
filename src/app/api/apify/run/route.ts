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

function pickFirstString(sources: Array<unknown>) {
  if (!Array.isArray(sources)) {
    return null;
  }

  for (const source of sources) {
    if (typeof source === "string") {
      return source;
    }
  }

  return null;
}

function extractSlidesFromAwemeDetail(awemeDetail: any): Array<{
  id: string;
  imageUrl: string;
  slideIndex?: number;
  textContent?: string;
  backgroundColor?: string;
  textPosition?: string;
  textColor?: string;
  fontSize?: number;
}> {
  const slides: Array<{
    id: string;
    imageUrl: string;
    slideIndex?: number;
    textContent?: string;
    backgroundColor?: string;
    textPosition?: string;
    textColor?: string;
    fontSize?: number;
  }> = [];

  // Try to extract slides from various possible structures in awemeDetail
  const images = awemeDetail?.imagePost?.images || [];

  images.forEach((image: any, index: number) => {
    if (
      image?.url_list &&
      Array.isArray(image.url_list) &&
      image.url_list.length > 0
    ) {
      slides.push({
        id: `slide-${index}`,
        imageUrl: image.url_list[0],
        slideIndex: index,
        textContent: awemeDetail?.desc || null,
        backgroundColor: image?.background_color || null,
        textPosition: image?.text_position || null,
        textColor: image?.text_color || null,
        fontSize: image?.font_size || null,
      });
    }
  });

  // If no slides found from imagePost, try other structures
  if (slides.length === 0) {
    const videoCover = awemeDetail?.video?.cover;
    if (
      videoCover?.url_list &&
      Array.isArray(videoCover.url_list) &&
      videoCover.url_list.length > 0
    ) {
      slides.push({
        id: `slide-0`,
        imageUrl: videoCover.url_list[0],
        slideIndex: 0,
        textContent: awemeDetail?.desc || null,
      });
    }
  }

  return slides;
}

async function callApify(payload: Record<string, unknown>) {
  console.log("[apify/run] Calling Apify with payload:", {
    payload,
  });

  const response = await fetch(
    `https://api.apify.com/v2/acts/scraptik~tiktok-api/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const responseText = await response.text();

  console.log("[apify/run] Apify response:", {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    responseLength: responseText.length,
    responseText: responseText,
  });

  if (!response.ok) {
    throw new ApifyIngestError(
      `Apify API request failed with status ${response.status}: ${responseText}`,
      response.status,
      responseText,
    );
  }

  let json;
  try {
    json = JSON.parse(responseText);
  } catch (parseError) {
    console.error("[apify/run] Failed to parse JSON response:", parseError);
    throw new ApifyIngestError(
      `Failed to parse Apify response: ${parseError}`,
      500,
      responseText,
    );
  }

  const items = Array.isArray(json) ? json : [json];
  return { items, raw: json };
}

export async function ingestTikTokPost({
  awemeId,
  profileUsername,
  ownerUserId,
}: {
  awemeId: string;
  profileUsername: string;
  ownerUserId?: string;
}) {
  const trimmedProfileUsername = profileUsername.trim();

  const accountFetch = await callApify({
    profile_username: trimmedProfileUsername,
  });

  const accountDetail = accountFetch.items?.[0] ?? null;
  const accountUser =
    accountDetail &&
    typeof accountDetail === "object" &&
    (accountDetail as Record<string, unknown>)?.user &&
    typeof (accountDetail as Record<string, unknown>).user === "object"
      ? ((accountDetail as Record<string, any>).user ?? accountDetail)
      : accountDetail;

  if (!accountDetail || typeof accountDetail !== "object") {
    throw new ApifyIngestError(
      "Unable to extract account detail from Apify response",
      422,
      accountFetch.raw,
    );
  }

  const accountAvatarUrls: Array<unknown> = [
    ...(accountUser?.avatar_larger?.url_list ?? []),
    ...(accountUser?.avatar_300x300?.url_list ?? []),
    ...(accountUser?.avatar_medium?.url_list ?? []),
    ...(accountUser?.avatar_thumb?.url_list ?? []),
  ];
  const accountProfileImageUrl = pickFirstString(accountAvatarUrls);

  const accountUsername = (
    accountUser?.unique_id ??
    accountUser?.short_id ??
    trimmedProfileUsername
  )
    ?.toString()
    ?.trim()
    .toLowerCase();

  const accountFollowerCount = toPositiveInt(accountUser?.follower_count);
  const accountFollowingCount = toPositiveInt(accountUser?.following_count);

  const accountData = {
    id: accountDetail.id?.toString(),
    username: accountUsername,
    displayName: accountUser?.nickname?.toString() ?? accountUsername,
    bio: accountUser?.signature?.toString() ?? null,
    profileImageUrl: accountProfileImageUrl ?? null,
    followerCount: accountFollowerCount,
    followingCount: accountFollowingCount,
    isVerified: accountUser?.verified ?? false,
    stats: {
      fans: accountFollowerCount,
      following: accountFollowingCount,
      heart: accountUser?.heart ?? 0,
      heartCount: accountUser?.heart ?? 0,
      digg: accountUser?.digg ?? 0,
      video: accountUser?.video ?? 0,
      videoCount: accountUser?.video ?? 0,
    },
  };

  const postFetch = await callApify({
    post_awemeId: awemeId,
  });

  const awemeDetail = findAwemeDetail(postFetch);
  if (!awemeDetail) {
    throw new ApifyIngestError(
      "Unable to extract aweme detail from Apify response",
      422,
      postFetch.raw,
    );
  }

  const videoUrl = Array.isArray(awemeDetail.video?.play_addr?.url_list)
    ? awemeDetail.video?.play_addr?.url_list?.[0]
    : awemeDetail.video?.play_addr_h264?.url_list?.[0];

  const videoUrlLow = Array.isArray(awemeDetail.video?.download_addr?.url_list)
    ? awemeDetail.video?.download_addr?.url_list?.[0]
    : awemeDetail.video?.play_addr_lowbr?.url_list?.[0];

  const videoDownloadUrl =
    (videoUrlLow ??
    videoUrl ??
    Array.isArray(awemeDetail.video?.bit_rate?.[0]?.play_addr?.url_list))
      ? awemeDetail.video?.bit_rate?.[0]?.play_addr?.url_list?.[0]
      : null;

  const caption = awemeDetail.desc?.toString() ?? null;

  const slides = extractSlidesFromAwemeDetail(awemeDetail);
  const slideCount = slides.length;

  const postData = {
    id: awemeDetail.id?.toString(),
    accountId: accountData.id,
    postId: awemeDetail.aweme_id?.toString(),
    caption,
    categories: [],
    likeCount: toPositiveInt(awemeDetail.statistics?.digg_count),
    viewCount: toPositiveInt(awemeDetail.statistics?.play_count),
    commentCount: toPositiveInt(awemeDetail.statistics?.comment_count),
    shareCount: toPositiveInt(awemeDetail.statistics?.share_count),
    publishedAt: new Date((awemeDetail.create_time ?? 0) * 1000),
    createdAt: new Date((awemeDetail.create_time ?? 0) * 1000),
    duration: awemeDetail.duration,
    videoUrl: videoUrl ?? null,
    videoDownloadUrl: videoDownloadUrl ?? null,
    videoH265Url: videoUrl ?? null,
    slideCount,
    slides,
    prompt: null,
  };

  // If it's an admin user, add directly to public library instead of user collection
  if (ownerUserId === "admin-library") {
    console.log(
      "[apify/run] Admin library user detected, adding directly to public library",
      {
        postId: postData.postId,
      },
    );

    try {
      // First, find or create the account to get a valid database ID
      console.log("[apify/run] Finding or creating account:", {
        username: accountData.username,
        displayName: accountData.displayName,
      });

      const accountResponse = await fetch(
        `${API_BASE_URL}/slideshow-library/accounts/find-or-create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: accountData.username,
            displayName: accountData.displayName,
            bio: accountData.bio,
            profileImageUrl: accountData.profileImageUrl,
            followerCount: accountData.followerCount,
            followingCount: accountData.followingCount,
            isVerified: accountData.isVerified,
          }),
        },
      );

      if (!accountResponse.ok) {
        const errorText = await accountResponse.text();
        throw new Error(`Failed to find or create account: ${errorText}`);
      }

      const createdAccount = await accountResponse.json();
      console.log("[apify/run] Account found/created:", {
        accountId: createdAccount.id,
        username: createdAccount.username,
      });

      const publicPostData = {
        accountId: createdAccount.id, // Use the database account ID
        postId: postData.postId,
        caption: postData.caption,
        categories: postData.categories,
        likeCount: postData.likeCount,
        viewCount: postData.viewCount,
        publishedAt: postData.publishedAt.toISOString(),
        createdAt: postData.createdAt.toISOString(),
        duration: postData.duration,
        slides: postData.slides,
      };

      console.log("[apify/run] Sending admin post to backend:", {
        apiBase: API_BASE_URL,
        endpoint: `${API_BASE_URL}/slideshow-library/posts`,
        postId: postData.postId,
        accountId: createdAccount.id,
        slidesCount: postData.slides?.length || 0,
        payload: publicPostData,
      });

      const publicPostResponse = await fetch(
        `${API_BASE_URL}/slideshow-library/posts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(publicPostData),
        },
      );

      if (publicPostResponse.ok) {
        console.log(
          "[apify/run] Successfully added admin post to public library",
          {
            postId: postData.postId,
          },
        );
      } else {
        const responseText = await publicPostResponse.text();
        console.error(
          "[apify/run] Failed to add admin post to public library",
          {
            status: publicPostResponse.status,
            postId: postData.postId,
            error: responseText,
          },
        );
        throw new ApifyIngestError(
          `Failed to add admin post to public library: ${responseText}`,
          500,
        );
      }
    } catch (error) {
      console.error("[apify/run] Error adding admin post to public library", {
        postId: postData.postId,
        error,
      });
      throw new ApifyIngestError(
        `Error adding admin post to public library: ${error}`,
        500,
      );
    }
  } else {
    // Normal user: create post in public library first, then add to user collection
    if (ownerUserId) {
      try {
        console.log("[apify/run] Normal user detected, creating post and linking to user collection");

        // First, find or create the account to get a valid database ID
        const accountResponse = await fetch(
          `${API_BASE_URL}/slideshow-library/accounts/find-or-create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: accountData.username,
              displayName: accountData.displayName,
              bio: accountData.bio,
              profileImageUrl: accountData.profileImageUrl,
              followerCount: accountData.followerCount,
              followingCount: accountData.followingCount,
              isVerified: accountData.isVerified,
            }),
          },
        );

        if (!accountResponse.ok) {
          const errorText = await accountResponse.text();
          throw new Error(`Failed to find or create account: ${errorText}`);
        }

        const createdAccount = await accountResponse.json();
        console.log("[apify/run] Account found/created for normal user:", {
          accountId: createdAccount.id,
          username: createdAccount.username,
        });

        // Create the post in public library
        const publicPostData = {
          accountId: createdAccount.id,
          postId: postData.postId,
          caption: postData.caption,
          categories: postData.categories,
          likeCount: postData.likeCount,
          viewCount: postData.viewCount,
          publishedAt: postData.publishedAt.toISOString(),
          createdAt: postData.createdAt.toISOString(),
          duration: postData.duration,
          slides: postData.slides,
        };

        console.log("[apify/run] Creating post in public library for normal user:", {
          postId: postData.postId,
          accountId: createdAccount.id,
          slidesCount: postData.slides?.length || 0,
        });

        const publicPostResponse = await fetch(
          `${API_BASE_URL}/slideshow-library/posts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(publicPostData),
          },
        );

        if (!publicPostResponse.ok) {
          const responseText = await publicPostResponse.text();
          throw new Error(`Failed to create post in public library: ${responseText}`);
        }

        const createdPost = await publicPostResponse.json();
        console.log("[apify/run] Post created successfully in public library:", {
          postId: createdPost.id,
          originalPostId: postData.postId,
        });

        // Now link the post to the user's collection
        const linkResponse = await fetch(`${API_BASE_URL}/slideshow-library/user-posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: ownerUserId,
            postId: createdPost.id, // Use the actual database post ID
          }),
        });

        if (!linkResponse.ok) {
          const errorText = await linkResponse.text();
          console.warn("[apify/run] Failed to link post to user collection", {
            userId: ownerUserId,
            postId: createdPost.id,
            error: errorText,
          });
        } else {
          console.log("[apify/run] Successfully linked post to user collection:", {
            userId: ownerUserId,
            postId: createdPost.id,
          });
        }
      } catch (error) {
        console.error("[apify/run] Error processing normal user post", {
          userId: ownerUserId,
          postId: postData.postId,
          error,
        });
      }
    }
  }

  let resultPostData = postData;

  // For normal users, update the post data with the created database IDs
  if (ownerUserId !== "admin-library") {
    // The postData object still contains the original data, but we need to
    // return the actual database IDs that were created
    console.log("[apify/run] Preparing result for normal user");
  }

  const result = {
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
    post: resultPostData,
  };

  return result;
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
      console.warn("[apify/run] Known ingestion error", {
        message: error.message,
        status: error.status,
        payload: error.payload,
      });
      return NextResponse.json(
        { error: error.message, data: error.payload },
        {
          status: error.status,
        },
      );
    }

    console.error("[apify/run] Unexpected failure", error);
    return NextResponse.json(
      { error: "Failed to ingest TikTok URL" },
      {
        status: 500,
      },
    );
  }
}
