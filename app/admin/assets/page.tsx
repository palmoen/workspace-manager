import { isAuthenticated } from "@/lib/auth";
import { AssetDashboard } from "@/components/AssetDashboard";
import { AppShell } from "@/components/AppShell";
import { PinForm } from "@/components/PinForm";

type Props = {
  searchParams: Promise<{ pin_error?: string }>;
};

export default async function AdminAssetsPage({ searchParams }: Props) {
  const { pin_error } = await searchParams;
  const authed = await isAuthenticated();

  if (!authed) {
    return <PinForm returnTo="/admin/assets" error={!!pin_error} />;
  }

  return (
    <AppShell>
      <AssetDashboard />
    </AppShell>
  );
}
