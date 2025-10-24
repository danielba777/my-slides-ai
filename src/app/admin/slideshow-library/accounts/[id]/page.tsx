"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SlideshowAccount {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  followerCount: number;
  followingCount: number;
  isVerified: boolean;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  posts: SlideshowPost[];
  _count: { posts: number };
}

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
  slides: Array<{
    id: string;
    slideIndex: number;
    imageUrl: string;
    textContent?: string;
  }>;
}

export default function AccountDetailPage() {
  const params = useParams();
  const accountId = params.id as string;

  const [account, setAccount] = useState<SlideshowAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accountId) {
      loadAccount();
    }
  }, [accountId]);

  const loadAccount = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/slideshow-library/accounts/${accountId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setAccount(data);
      } else {
        toast.error("Fehler beim Laden des Accounts");
      }
    } catch (error) {
      console.error("Error loading account:", error);
      toast.error("Fehler beim Laden des Accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const syncAccount = async () => {
    try {
      const response = await fetch(
        `/api/slideshow-library/accounts/${accountId}/sync`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        toast.success("Account synchronisiert");
        loadAccount();
      } else {
        toast.error("Fehler beim Synchronisieren");
      }
    } catch (error) {
      console.error("Error syncing account:", error);
      toast.error("Fehler beim Synchronisieren");
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
        loadAccount();
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
          <p className="text-muted-foreground">Lade Account...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Account nicht gefunden</p>
        <Link
          href="/admin/slideshow-library/accounts"
          className={cn(
            buttonVariants({ variant: "default" }),
            "mt-4 inline-flex items-center gap-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/slideshow-library/accounts"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex items-center gap-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{account.displayName}</h1>
          <p className="text-muted-foreground">@{account.username}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncAccount}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Link
            href={`/admin/slideshow-library/accounts/${account.id}/edit`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex items-center gap-2",
            )}
          >
            <Edit className="h-4 w-4" />
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {account.profileImageUrl ? (
              <img
                src={account.profileImageUrl}
                alt={account.displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{account.displayName}</h2>
                <p className="text-muted-foreground">@{account.username}</p>
                {account.bio && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {account.bio}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Badge variant="secondary">
                  {account.followerCount.toLocaleString()} Follower
                </Badge>
                <Badge variant="outline">
                  {account.followingCount.toLocaleString()} Following
                </Badge>
                <Badge variant="outline">{account._count.posts} Posts</Badge>
                {account.isVerified && (
                  <Badge variant="default">Verified</Badge>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  Erstellt:{" "}
                  {new Date(account.createdAt).toLocaleDateString("de-DE")}
                </p>
                {account.lastSyncedAt && (
                  <p>
                    Letzte Sync:{" "}
                    {new Date(account.lastSyncedAt).toLocaleDateString("de-DE")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Posts ({account.posts.length})</h2>
        <Link
          href={`/admin/slideshow-library/posts/new?accountId=${account.id}`}
          className={cn(
            buttonVariants({ variant: "default" }),
            "inline-flex items-center gap-2",
          )}
        >
          <Plus className="h-4 w-4" />
          Neuer Post
        </Link>
      </div>

      {account.posts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Posts vorhanden</p>
              <p className="text-sm">
                Erstelle den ersten Post für diesen Account
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {account.posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Post #{post.postId}
                  </CardTitle>
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

                <Link
                  href={`/admin/slideshow-library/posts/${post.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full inline-flex items-center justify-center gap-2",
                  )}
                >
                  <Eye className="h-4 w-4" />
                  Details ansehen
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
