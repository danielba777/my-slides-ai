"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Eye,
  MessageSquare,
  Share2,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SlideshowPost {
  id: string;
  postId: string;
  accountId: string;
  caption?: string;
  prompt?: string | null;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt: string;
  createdAt?: string;
  slideCount: number;
  isActive: boolean;
  slides: Array<{
    id: string;
    slideIndex: number;
    imageUrl: string;
    textContent?: string;
    duration?: number;
  }>;
  account?: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
  } | null;
}

export default function SlideshowPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string | undefined;

  const [post, setPost] = useState<SlideshowPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [slides, setSlides] = useState<SlideshowPost["slides"]>([]);
  const [initialSlides, setInitialSlides] = useState<SlideshowPost["slides"]>(
    [],
  );
  const [initialOrderIds, setInitialOrderIds] = useState<string[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    if (!postId) {
      return;
    }

    const loadPost = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/slideshow-library/posts/${postId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Post nicht gefunden");
          } else {
            toast.error("Fehler beim Laden des Posts");
          }
          setPost(null);
          return;
        }

        const data = (await response.json()) as SlideshowPost;
        const orderedSlides = [...(data.slides ?? [])].sort(
          (a, b) => a.slideIndex - b.slideIndex,
        );
        const normalizedSlides = orderedSlides.map((slide, index) => ({
          ...slide,
          slideIndex: index,
        }));

        setPost({
          ...data,
          slides: normalizedSlides,
          slideCount: normalizedSlides.length,
        });
        setSlides(normalizedSlides);
        setInitialSlides(normalizedSlides.map((slide) => ({ ...slide })));
        setInitialOrderIds(normalizedSlides.map((slide) => slide.id));
        setPromptDraft(data.prompt ?? "");
      } catch (error) {
        console.error("Error loading post:", error);
        toast.error("Fehler beim Laden des Posts");
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPost();
  }, [postId]);

  useEffect(() => {
    if (post) {
      setPromptDraft(post.prompt ?? "");
    }
  }, [post?.id]);

  const hasOrderChanged =
    slides.length === initialOrderIds.length &&
    slides.some((slide, index) => slide.id !== initialOrderIds[index]);

  const promptHasChanged = (post?.prompt ?? "").trim() !== promptDraft.trim();

  const handlePromptSave = async () => {
    if (!post || !promptHasChanged || isSavingPrompt) {
      return;
    }

    try {
      setIsSavingPrompt(true);
      const normalizedPrompt = promptDraft.trim();
      const response = await fetch(
        `/api/slideshow-library/posts/${post.id}/prompt`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: normalizedPrompt.length > 0 ? normalizedPrompt : null,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Prompt konnte nicht gespeichert werden",
        );
      }

      const updated = (await response.json()) as SlideshowPost;
      setPost((prev) =>
        prev
          ? {
              ...prev,
              prompt: updated.prompt ?? null,
            }
          : prev,
      );
      setPromptDraft(updated.prompt ?? "");
      toast.success("Prompt gespeichert");
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Prompt konnte nicht gespeichert werden",
      );
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    setSlides((current) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const swapped = [...current];
      if (swapped[index] && swapped[targetIndex]) {
        [swapped[index], swapped[targetIndex]] = [
          swapped[targetIndex]!,
          swapped[index]!,
        ];
      }

      const normalized = swapped.map((slide, idx) => ({
        ...slide,
        slideIndex: idx,
      }));

      setPost((prev) =>
        prev
          ? { ...prev, slides: normalized, slideCount: normalized.length }
          : prev,
      );

      return normalized;
    });
  };

  const resetOrder = () => {
    const resetSlides = initialSlides.map((slide, index) => ({
      ...slide,
      slideIndex: index,
    }));
    setSlides(resetSlides);
    setPost((prev) =>
      prev
        ? { ...prev, slides: resetSlides, slideCount: resetSlides.length }
        : prev,
    );
  };

  const handleSaveOrder = async () => {
    if (!post || slides.length === 0) {
      return;
    }

    try {
      setIsSavingOrder(true);
      const response = await fetch(
        `/api/slideshow-library/posts/${post.id}/reorder`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slideIds: slides.map((slide) => slide.id) }),
        },
      );

      if (!response.ok) {
        toast.error("Reihenfolge konnte nicht gespeichert werden");
        return;
      }

      const data = (await response.json()) as SlideshowPost;
      const orderedSlides = [...(data.slides ?? [])].sort(
        (a, b) => a.slideIndex - b.slideIndex,
      );
      const normalizedSlides = orderedSlides.map((slide, index) => ({
        ...slide,
        slideIndex: index,
      }));

      setPost({
        ...data,
        slides: normalizedSlides,
        slideCount: normalizedSlides.length,
      });
      setSlides(normalizedSlides);
      setInitialSlides(normalizedSlides.map((slide) => ({ ...slide })));
      setInitialOrderIds(normalizedSlides.map((slide) => slide.id));
      toast.success("Reihenfolge aktualisiert");
      setPromptDraft(data.prompt ?? "");
    } catch (error) {
      console.error("Error saving slide order:", error);
      toast.error("Fehler beim Speichern der Reihenfolge");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const deletePost = async () => {
    if (!post) {
      return;
    }

    if (
      !confirm(
        "Möchtest du diesen Post wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/slideshow-library/posts/${post.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Post gelöscht");
        router.push("/admin/slideshow-library/posts");
      } else {
        toast.error("Fehler beim Löschen des Posts");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Fehler beim Löschen des Posts");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/slideshow-library/posts"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex items-center gap-2",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
          <h1 className="text-3xl font-bold">Slideshow Post</h1>
        </div>

        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Post konnte nicht geladen werden.
          </CardContent>
        </Card>
      </div>
    );
  }

  const account = post.account ?? null;
  const displayName = account?.displayName ?? "Unbekannter Account";
  const username = account?.username
    ? `@${account.username}`
    : "Account unbekannt";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/slideshow-library/posts"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex items-center gap-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <h1 className="text-3xl font-bold">Slideshow Post</h1>
        <Badge variant={post.isActive ? "default" : "outline"}>
          {post.isActive ? "Aktiv" : "Inaktiv"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-xl">Post Übersicht</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                <ThumbsUp className="h-3 w-3" />
                {post.likeCount.toLocaleString()} Likes
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                <Eye className="h-3 w-3" />
                {post.viewCount.toLocaleString()} Views
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                <MessageSquare className="h-3 w-3" />
                {post.commentCount.toLocaleString()} Kommentare
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                <Share2 className="h-3 w-3" />
                {post.shareCount.toLocaleString()} Shares
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                <CalendarDays className="h-3 w-3" />
                {new Date(post.publishedAt).toLocaleDateString("de-DE")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Caption
              </h2>
              <p className="mt-2 text-sm">
                {post.caption?.length
                  ? post.caption
                  : "Keine Caption hinterlegt"}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Slides ({slides.length})
              </h2>
              {slides.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Keine Slides vorhanden.
                </p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className="rounded-lg border overflow-hidden flex flex-col"
                      >
                        <div className="relative">
                          <img
                            src={slide.imageUrl}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-40 object-cover"
                          />
                          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                            #{index + 1}
                          </span>
                        </div>
                        {slide.textContent && (
                          <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/40">
                            {slide.textContent}
                          </div>
                        )}
                        {slides.length > 1 && (
                          <div className="flex items-center justify-between border-t px-3 py-2">
                            <span className="text-xs text-muted-foreground">
                              Reihenfolge
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => moveSlide(index, "up")}
                                disabled={index === 0 || isSavingOrder}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => moveSlide(index, "down")}
                                disabled={
                                  index === slides.length - 1 || isSavingOrder
                                }
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {slides.length > 1 && (
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetOrder}
                        disabled={!hasOrderChanged || isSavingOrder}
                      >
                        Zurücksetzen
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveOrder}
                        disabled={!hasOrderChanged || isSavingOrder}
                      >
                        {isSavingOrder
                          ? "Speichern..."
                          : "Reihenfolge speichern"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {account?.profileImageUrl ? (
                  <img
                    src={account.profileImageUrl}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{username}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Post ID</span>
                  <span>{post.postId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID</span>
                  <span>{post.accountId}</span>
                </div>
                {post.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Erstellt am</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/admin/slideshow-library/accounts/${post.accountId}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full",
                  )}
                >
                  Account anzeigen
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={deletePost}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Post löschen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={promptDraft}
                onChange={(event) => setPromptDraft(event.target.value)}
                rows={4}
                placeholder="Prompt hinzufügen, um festzuhalten wie diese Slideshow erstellt wurde."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPromptDraft(post.prompt ?? "")}
                  disabled={!promptHasChanged || isSavingPrompt}
                >
                  Zurücksetzen
                </Button>
                <Button
                  size="sm"
                  onClick={handlePromptSave}
                  disabled={!promptHasChanged || isSavingPrompt}
                >
                  {isSavingPrompt ? "Speichert..." : "Prompt speichern"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
