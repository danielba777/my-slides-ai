Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

# src/components/marketing/MarketingLibraryPreview.tsx

@@
-type DisplayPost = {

- id: string;
- likeCount: number;
- viewCount: number;
- imageUrl: string | null;
- title: string;
- creator: string;
- trending: boolean;
- isPlaceholder?: boolean;
  -};
  +type DisplayPost = {

* id: string;
* likeCount: number;
* viewCount: number;
* imageUrl: string | null;
* title?: string; // optional, wird nicht mehr angezeigt
* creator?: string; // optional, wird nicht mehr angezeigt
* trending: boolean;
* isPlaceholder?: boolean;
  +};
  @@
  -const PLACEHOLDER_POSTS: DisplayPost[] = [
  +const PLACEHOLDER_POSTS: DisplayPost[] = [
  {
  id: "placeholder-0",
  likeCount: 6_240,
  viewCount: 128_400,
  imageUrl: null,

- title: "Viral slideshow 1",
- creator: "Creator 1",
  trending: true,
  isPlaceholder: true,
  },
  {
  id: "placeholder-1",
  likeCount: 12_950,
  viewCount: 256_800,
  imageUrl: null,
- title: "Viral slideshow 2",
- creator: "Creator 2",
  trending: true,
  isPlaceholder: true,
  },
  {
  id: "placeholder-2",
  likeCount: 8_100,
  viewCount: 201_500,
  imageUrl: null,
- title: "Viral slideshow 3",
- creator: "Creator 3",
  trending: true,
  isPlaceholder: true,
  },
  {
  id: "placeholder-3",
  likeCount: 4_380,
  viewCount: 97_200,
  imageUrl: null,
- title: "Viral slideshow 4",
- creator: "Creator 4",
  trending: false,
  isPlaceholder: true,
  },
  {
  id: "placeholder-4",
  likeCount: 3_520,
  viewCount: 72_900,
  imageUrl: null,
- title: "Viral slideshow 5",
- creator: "Creator 5",
  trending: false,
  isPlaceholder: true,
  },
  {
  id: "placeholder-5",
  likeCount: 17_600,
  viewCount: 312_400,
  imageUrl: null,
- title: "Viral slideshow 6",
- creator: "Creator 6",
  trending: false,
  isPlaceholder: true,
  },
  {
  id: "placeholder-6",
  likeCount: 2_310,
  viewCount: 58_400,
  imageUrl: null,
- title: "Viral slideshow 7",
- creator: "Creator 7",
  trending: false,
  isPlaceholder: true,
  },
  {
  id: "placeholder-7",
  likeCount: 9_020,
  viewCount: 146_900,
  imageUrl: null,
- title: "Viral slideshow 8",
- creator: "Creator 8",
  trending: false,
  isPlaceholder: true,
  },
  ];
  @@
  const topEight = useMemo<DisplayPost[]>(() => {
  if (!posts.length) return [];
  return [...posts]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 8)
  .map((post, index) => ({
  id: post.id,
  likeCount: post.likeCount,
  viewCount: post.viewCount,
  imageUrl: post.slides?.[0]?.imageUrl ?? null,
-        title: post.title || `Viral slideshow ${index + 1}`,
-        creator: post.creator || `Creator ${index + 1}`,

*        title: post.title ?? "",
*        creator: post.creator ?? "",
           trending: index < 3,
         }));
  }, [posts]);
  @@

-                    {post.imageUrl && !isPlaceholder ? (

*                    {post.imageUrl && !isPlaceholder ? (
                       <img
                         src={post.imageUrl}

-                        alt={post.title}

*                        alt="slide preview"
                           className="h-full w-full object-cover transition duration-700 group-hover:rotate-1 group-hover:scale-110"
                           loading="lazy"
                         />
                       ) : (
  @@

-                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
-                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
-                        <span className="flex items-center gap-1 text-base font-semibold text-white">
-                          <PlayIcon className="h-4 w-4" />
-                          {formatCount(post.viewCount)} Views
-                        </span>
-                        <span className="flex items-center gap-1 text-base font-semibold text-white">
-                          <HeartIcon className="h-4 w-4" />
-                          {formatCount(post.likeCount)} Likes
-                        </span>
-                        {post.title && (
-                          <span className="line-clamp-2 text-sm text-gray-200">
-                            „{post.title}"
-                          </span>
-                        )}
-                      </div>
-                    </div>

*                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
*                      <div className="flex flex-col gap-1">
*                        <span className="flex items-center gap-1 text-base font-semibold text-white">
*                          <PlayIcon className="h-4 w-4" />
*                          {formatCount(post.viewCount)} Views
*                        </span>
*                        <span className="flex items-center gap-1 text-base font-semibold text-white">
*                          <HeartIcon className="h-4 w-4" />
*                          {formatCount(post.likeCount)} Likes
*                        </span>
*                      </div>
*                    </div>
