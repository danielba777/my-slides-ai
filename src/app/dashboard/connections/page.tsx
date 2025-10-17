import { TikTokConnectionCard } from "@/components/connections/tiktok-connection-card";

export default function ConnectionsPage() {
  return (
    <div className="w-full px-10 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Connected Accounts</h1>
      </div>
      <TikTokConnectionCard />
    </div>
  );
}
