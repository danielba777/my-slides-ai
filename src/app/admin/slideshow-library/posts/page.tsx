"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, FileText, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SlideshowPost {
  id: string;
  postId: string;
  caption?: string;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt: string;
  slideCount: number;
  isActive: boolean;
  prompt?: string | null;
  accountId: string;
  account?: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
  } | null;
  slides: Array<{
    id: string;
    slideIndex: number;
    imageUrl: string;
    textContent?: string;
  }>;
}

interface SlideshowAccount {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
}

export default function SlideshowPostsPage() {
  const [posts, setPosts] = useState<SlideshowPost[]>([]);
  const [accounts, setAccounts] = useState<SlideshowAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [promptDraft, setPromptDraft] = useState<string>("");
  const [savingPostId, setSavingPostId] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
    loadPosts();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const response = await fetch("/api/slideshow-library/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedAccount !== "all") {
        params.set("accountId", selectedAccount);
      }

      const response = await fetch(
        `/api/slideshow-library/posts?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        toast.error("Fehler beim Laden der Posts");
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Fehler beim Laden der Posts");
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Möchtest du diesen Post wirklich löschen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/slideshow-library/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Post gelöscht");
        loadPosts();
      } else {
        toast.error("Fehler beim Löschen des Posts");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Fehler beim Löschen des Posts");
    }
  };

  const startEditingPrompt = (post: SlideshowPost) => {
    setEditingPostId(post.id);
    setPromptDraft(post.prompt ?? "");
  };

  const cancelEditingPrompt = () => {
    setEditingPostId(null);
    setPromptDraft("");
  };

  const savePrompt = async (post: SlideshowPost) => {
    if (savingPostId) {
      return;
    }

    const normalizedPrompt = promptDraft.trim();
    const body = {
      prompt: normalizedPrompt.length > 0 ? normalizedPrompt : null,
    };

    try {
      setSavingPostId(post.id);
      const response = await fetch(
        `/api/slideshow-library/posts/${post.id}/prompt`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Prompt konnte nicht gespeichert werden",
        );
      }

      const updated = (await response.json()) as SlideshowPost;
      setPosts((prev) =>
        prev.map((existing) =>
          existing.id === post.id
            ? { ...existing, prompt: updated.prompt ?? null }
            : existing,
        ),
      );
      toast.success("Prompt gespeichert");
      setEditingPostId(null);
      setPromptDraft("");
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Prompt konnte nicht gespeichert werden",
      );
    } finally {
      setSavingPostId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Slideshow Posts</h1>
          <p className="text-muted-foreground">
            Verwalte Slideshow Posts von TikTok Accounts
          </p>
        </div>
        <Link
          href="/admin/slideshow-library/posts/new"
          className={cn(
            buttonVariants({ variant: "default" }),
            "flex items-center gap-2",
          )}
        >
          <Plus className="h-4 w-4" />
          Neuer Post
        </Link>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Account filtern:</label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    @{account.username} - {account.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Posts vorhanden</p>
              <p className="text-sm">Erstelle deinen ersten Slideshow Post</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const accountFromPost = post.account ?? null;
            const accountFromList = accounts.find(
              (candidate) =>
                candidate.id === (accountFromPost?.id ?? post.accountId),
            );
            const profileImageUrl =
              accountFromPost?.profileImageUrl ??
              accountFromList?.profileImageUrl;
            const displayName =
              accountFromPost?.displayName ??
              accountFromList?.displayName ??
              "Unbekannter Account";
            const usernameValue =
              accountFromPost?.username ?? accountFromList?.username;
            const username = usernameValue
              ? `@${usernameValue}`
              : "Account unbekannt";
            const isEditingPrompt = editingPostId === post.id;
            const isSavingPrompt = savingPostId === post.id;
            const hasPrompt = (post.prompt ?? "").trim().length > 0;

            return (
              <Card
                key={post.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">
                          {displayName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {username}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Slideshow Preview */}
                  <div className="grid grid-cols-3 gap-1">
                    {post.slides.slice(0, 3).map((slide, index) => (
                      <div key={slide.id} className="aspect-square">
                        <img
                          src={slide.imageUrl}
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-cover rounded border"
                        />
                      </div>
                    ))}
                    {post.slideCount > 3 && (
                      <div className="aspect-square bg-muted rounded border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{post.slideCount - 3}
                        </span>
                      </div>
                    )}
                  </div>

                  {post.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.caption}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.likeCount.toLocaleString()} Likes
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {post.viewCount.toLocaleString()} Views
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {post.slideCount} Slides
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {new Date(post.publishedAt).toLocaleDateString("de-DE")}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                      Prompt
                    </h3>
                    {isEditingPrompt ? (
                      <div className="space-y-2">
                        <Textarea
                          value={promptDraft}
                          onChange={(event) =>
                            setPromptDraft(event.target.value)
                          }
                          rows={4}
                          placeholder="Prompt hinzufügen, um festzuhalten wie dieser Post erstellt wurde."
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditingPrompt}
                            disabled={isSavingPrompt}
                          >
                            Abbrechen
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => savePrompt(post)}
                            disabled={
                              isSavingPrompt ||
                              (post.prompt ?? "").trim() === promptDraft.trim()
                            }
                          >
                            {isSavingPrompt ? "Speichert..." : "Speichern"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {hasPrompt
                            ? post.prompt
                            : "Kein Prompt hinterlegt."}
                        </p>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingPrompt(post)}
                          >
                            {hasPrompt ? "Prompt bearbeiten" : "Prompt hinzufügen"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/admin/slideshow-library/posts/${post.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full flex items-center justify-center gap-2",
                    )}
                  >
                    <Eye className="h-4 w-4" />
                    Details ansehen
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
