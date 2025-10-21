"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Save, Upload, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
}

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    bio: "",
    profileImageUrl: "",
    followerCount: 0,
    followingCount: 0,
    isVerified: false,
  });

  useEffect(() => {
    if (accountId) {
      void loadAccount();
    }
  }, [accountId]);

  const loadAccount = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/slideshow-library/accounts/${accountId}`);
      if (!response.ok) {
        toast.error("Account konnte nicht geladen werden");
        router.push("/admin/slideshow-library/accounts");
        return;
      }

      const data = (await response.json()) as SlideshowAccount;
      setFormData({
        username: data.username,
        displayName: data.displayName,
        bio: data.bio ?? "",
        profileImageUrl: data.profileImageUrl ?? "",
        followerCount: data.followerCount ?? 0,
        followingCount: data.followingCount ?? 0,
        isVerified: data.isVerified ?? false,
      });
    } catch (error) {
      console.error("Error loading account:", error);
      toast.error("Fehler beim Laden des Accounts");
      router.push("/admin/slideshow-library/accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const uploadData = new FormData();
    uploadData.append("profileImage", file);

    setIsUploadingImage(true);
    try {
      const response = await fetch("/api/slideshow-library/accounts/upload-profile", {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.url) {
        toast.error(data?.error ?? "Fehler beim Hochladen des Profilbilds");
        return;
      }
      setFormData((prev) => ({ ...prev, profileImageUrl: data.url }));
      toast.success("Profilbild aktualisiert");
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.error("Fehler beim Hochladen des Profilbilds");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeProfileImage = () => {
    setFormData((prev) => ({ ...prev, profileImageUrl: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.displayName.trim()) {
      toast.error("Username und Display Name sind erforderlich");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/slideshow-library/accounts/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error ?? "Fehler beim Aktualisieren des Accounts");
        return;
      }

      toast.success("Account aktualisiert");
      router.push(`/admin/slideshow-library/accounts/${accountId}`);
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error("Fehler beim Aktualisieren des Accounts");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          <Spinner className="mx-auto mb-3 h-6 w-6 animate-spin" />
          Account wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/slideshow-library/accounts/${accountId}`}
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <h1 className="text-3xl font-bold">Account bearbeiten</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="@username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange("displayName", e.target.value)}
                  placeholder="Anzeigename"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Profilbild</Label>
                <div className="flex items-start gap-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-muted">
                    {formData.profileImageUrl ? (
                      <img
                        src={formData.profileImageUrl}
                        alt="Profilbild Vorschau"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Kein Bild
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleProfileImageUpload(event.target.files)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      <Upload className="h-4 w-4" />
                      Bild hochladen
                    </Button>
                    {formData.profileImageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive"
                        onClick={removeProfileImage}
                        disabled={isUploadingImage}
                      >
                        <Trash2 className="h-4 w-4" />
                        Bild entfernen
                      </Button>
                    )}
                    {isUploadingImage && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Spinner className="h-3 w-3" />
                        Upload läuft...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Account Beschreibung"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followerCount">Follower Count</Label>
                <Input
                  id="followerCount"
                  type="number"
                  value={formData.followerCount}
                  onChange={(e) =>
                    handleInputChange(
                      "followerCount",
                      parseInt(e.target.value, 10) || 0,
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followingCount">Following Count</Label>
                <Input
                  id="followingCount"
                  type="number"
                  value={formData.followingCount}
                  onChange={(e) =>
                    handleInputChange(
                      "followingCount",
                      parseInt(e.target.value, 10) || 0,
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVerified"
                    checked={formData.isVerified}
                    onCheckedChange={(checked) =>
                      handleInputChange("isVerified", checked === true)
                    }
                  />
                  <Label htmlFor="isVerified">Verified Account</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? "Wird aktualisiert..." : "Änderungen speichern"}
              </Button>
              <Link
                href={`/admin/slideshow-library/accounts/${accountId}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex items-center gap-2",
                )}
              >
                Abbrechen
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
