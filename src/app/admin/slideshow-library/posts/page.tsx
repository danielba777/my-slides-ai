"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { cn } from "@/lib/utils";
import { Eye, FileText, Plus, Trash2, Users, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

const POSTS_PER_PAGE = 60;

interface SlideshowPost {
  id: string;
  postId: string;
  caption?: string;
  categories?: string[];
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
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadAccounts();
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [currentPage, selectedAccount]);

  useEffect(() => {
    // Reset to page 1 when account filter changes
    setCurrentPage(1);
  }, [selectedAccount]);

  useEffect(() => {
    const handleFocus = () => {
      loadPosts();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentPage, selectedAccount]);

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

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/slideshow-library/categories");
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      // Add pagination parameters
      const offset = (currentPage - 1) * POSTS_PER_PAGE;
      params.set("limit", POSTS_PER_PAGE.toString());
      params.set("offset", offset.toString());

      if (selectedAccount !== "all") {
        params.set("accountId", selectedAccount);
      }

      const response = await fetch(
        `/api/slideshow-library/posts?${params.toString()}`,
        { cache: "no-store" },
      );
      if (response.ok) {
        const data = await response.json();

        let postsData: SlideshowPost[] = [];
        if (Array.isArray(data)) {
          postsData = data;
        } else if (data && Array.isArray(data.posts)) {
          postsData = data.posts;

          // Set total count and calculate total pages
          const totalCount = data.totalCount || 0;
          setTotalPosts(totalCount);
          setTotalPages(Math.ceil(totalCount / POSTS_PER_PAGE) || 1);
        } else if (data && typeof data === 'object') {
          console.error("Unexpected API response format:", data);
          toast.error("Ungültiges Datenformat vom Server erhalten");
        }

        setPosts(postsData);
      } else {
        toast.error("Fehler beim Laden der Posts");
        setPosts([]);
        setTotalPosts(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Fehler beim Laden der Posts");
      setPosts([]);
      setTotalPosts(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategories = async (postId: string, categories: string[]) => {
    try {
      setUpdatingPostId(postId);
      const response = await fetch(`/api/slideshow-library/posts/${postId}/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });

      if (response.ok) {
        toast.success("Kategorien aktualisiert");

        // Update local state
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId ? { ...post, categories } : post
          )
        );

        // Add new categories to available categories list (optimistic update)
        const newCategories = categories.filter(cat => !availableCategories.includes(cat));
        if (newCategories.length > 0) {
          setAvailableCategories(prev => [...prev, ...newCategories].sort());
        }

        // Reload categories from server to ensure consistency
        loadCategories();
      } else {
        toast.error("Fehler beim Aktualisieren der Kategorien");
      }
    } catch (error) {
      console.error("Error updating categories:", error);
      toast.error("Fehler beim Aktualisieren der Kategorien");
    } finally {
      setUpdatingPostId(null);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of page
    if (pageTopRef.current) {
      const anchorTop = window.scrollY + pageTopRef.current.getBoundingClientRect().top;
      window.scrollTo({
        top: Math.max(anchorTop - 20, 0),
        behavior: "smooth",
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div ref={pageTopRef} className="flex items-center justify-between">
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
          <CardContent className="flex h-64 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Noch keine Posts vorhanden</p>
              <p className="text-sm">Erstelle deinen ersten Slideshow Post</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Übersicht
              <Badge variant="secondary" className="text-xs">
                {totalPosts} gesamt
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[28%]">Post</TableHead>
                    <TableHead className="w-[20%]">Kategorien</TableHead>
                    <TableHead className="w-[20%]">Account</TableHead>
                    <TableHead className="w-[14%]">Performance</TableHead>
                    <TableHead className="w-[8%]">Status</TableHead>
                    <TableHead className="w-[10%] text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => {
                    const accountFromPost = post.account ?? null;
                    const accountFromList = accounts.find(
                      (candidate) =>
                        candidate.id ===
                        (accountFromPost?.id ?? post.accountId),
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
                    const categories = Array.isArray(post.categories)
                      ? post.categories
                      : [];

                    return (
                      <TableRow key={post.id} className="text-sm">
                        <TableCell className="align-middle">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded border bg-muted">
                              {post.slides.length > 0 ? (
                                <img
                                  src={post.slides[0]?.imageUrl}
                                  alt={post.caption || `Post ${post.postId}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                  Kein Bild
                                </div>
                              )}
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate font-medium">
                                {`Post ${post.postId}`}
                              </span>
                              <Badge variant="outline" className="shrink-0 text-xs">
                                {post.slideCount} Slides
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 justify-between gap-2 text-xs"
                                disabled={updatingPostId === post.id}
                              >
                                <span className="truncate">
                                  {categories.length > 0
                                    ? `${categories.length} ${categories.length === 1 ? 'Kategorie' : 'Kategorien'}`
                                    : 'Kategorien wählen'}
                                </span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="start">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold">Kategorien</h4>
                                  {categories.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => updateCategories(post.id, [])}
                                    >
                                      Alle entfernen
                                    </Button>
                                  )}
                                </div>

                                {/* Currently selected categories */}
                                {categories.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pb-2 border-b">
                                    {categories.map((category) => (
                                      <Badge
                                        key={`selected-${post.id}-${category}`}
                                        variant="secondary"
                                        className="text-xs flex items-center gap-1"
                                      >
                                        {category}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateCategories(
                                              post.id,
                                              categories.filter((c) => c !== category)
                                            );
                                          }}
                                          className="ml-1 rounded-sm hover:bg-muted"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Available categories */}
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                  {availableCategories
                                    .filter((cat) => !categories.includes(cat))
                                    .map((category) => (
                                      <div
                                        key={`available-${post.id}-${category}`}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`cat-${post.id}-${category}`}
                                          checked={categories.includes(category)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              updateCategories(post.id, [...categories, category]);
                                            } else {
                                              updateCategories(
                                                post.id,
                                                categories.filter((c) => c !== category)
                                              );
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor={`cat-${post.id}-${category}`}
                                          className="text-sm cursor-pointer flex-1"
                                        >
                                          {category}
                                        </label>
                                      </div>
                                    ))}
                                  {availableCategories.filter((cat) => !categories.includes(cat)).length === 0 && categories.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Alle Kategorien ausgewählt
                                    </p>
                                  )}
                                  {availableCategories.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Keine Kategorien verfügbar
                                    </p>
                                  )}
                                </div>

                                {/* Add new category */}
                                <div className="pt-2 border-t">
                                  <Input
                                    placeholder="Neue Kategorie..."
                                    className="h-8 text-xs"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const value = e.currentTarget.value.trim();
                                        if (value && !categories.includes(value)) {
                                          updateCategories(post.id, [...categories, value]);
                                          e.currentTarget.value = "";
                                        }
                                      }
                                    }}
                                  />
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Enter drücken zum Hinzufügen
                                  </p>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex min-w-0 items-center gap-2">
                            {profileImageUrl ? (
                              <img
                                src={profileImageUrl}
                                alt={displayName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <Users className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="truncate">{displayName}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {username}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground sm:text-sm">
                            <span>{post.likeCount.toLocaleString()} Likes</span>
                            <span>{post.viewCount.toLocaleString()} Views</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={post.isActive ? "secondary" : "outline"}
                              className="shrink-0 text-xs"
                            >
                              {post.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {new Date(post.publishedAt).toLocaleDateString(
                                "de-DE",
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/slideshow-library/posts/${post.id}`}
                              aria-label="Details anzeigen"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "icon" }),
                              )}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePost(post.id)}
                              className="text-destructive hover:text-destructive"
                              aria-label="Post löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Zeige {((currentPage - 1) * POSTS_PER_PAGE) + 1} bis {Math.min(currentPage * POSTS_PER_PAGE, totalPosts)} von {totalPosts} Posts
                </div>
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
