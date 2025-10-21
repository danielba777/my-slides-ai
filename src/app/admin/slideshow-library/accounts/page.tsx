"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Eye, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  _count: { posts: number };
}

export default function SlideshowAccountsPage() {
  const [accounts, setAccounts] = useState<SlideshowAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/slideshow-library/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        toast.error("Fehler beim Laden der Accounts");
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      toast.error("Fehler beim Laden der Accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const syncAccount = async (accountId: string) => {
    try {
      const response = await fetch(
        `/api/slideshow-library/accounts/${accountId}/sync`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        toast.success("Account synchronisiert");
        loadAccounts();
      } else {
        toast.error("Fehler beim Synchronisieren");
      }
    } catch (error) {
      console.error("Error syncing account:", error);
      toast.error("Fehler beim Synchronisieren");
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (
      !confirm(
        "Möchtest du diesen Account wirklich löschen? Alle Posts werden ebenfalls gelöscht.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/slideshow-library/accounts/${accountId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("Account gelöscht");
        loadAccounts();
      } else {
        toast.error("Fehler beim Löschen des Accounts");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Fehler beim Löschen des Accounts");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">TikTok Accounts</h1>
          <p className="text-muted-foreground">
            Verwalte TikTok Accounts für die Slideshow Library
          </p>
        </div>
        <Link
          href="/admin/slideshow-library/accounts/new"
          className={cn(buttonVariants({ variant: "default" }), "flex items-center gap-2")}
        >
          <Plus className="h-4 w-4" />
          Neuer Account
        </Link>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Accounts vorhanden</p>
              <p className="text-sm">Erstelle deinen ersten TikTok Account</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {account.profileImageUrl ? (
                      <img
                        src={account.profileImageUrl}
                        alt={account.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {account.displayName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        @{account.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncAccount(account.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {account.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {account.bio}
                  </p>
                )}

                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {account.followerCount.toLocaleString()} Follower
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {account._count.posts} Posts
                  </Badge>
                  {account.isVerified && (
                    <Badge variant="default" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/slideshow-library/accounts/${account.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "flex-1 flex items-center justify-center gap-2",
                    )}
                  >
                    <Eye className="h-4 w-4" />
                    Ansehen
                  </Link>
                  <Link
                    href={`/admin/slideshow-library/accounts/${account.id}/edit`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "flex-1 flex items-center justify-center gap-2",
                    )}
                  >
                    <Edit className="h-4 w-4" />
                    Bearbeiten
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
