import { isAuthenticated } from "@/lib/auth";
import { PrintAdmin } from "@/components/PrintAdmin";
import { AppShell } from "@/components/AppShell";
import { PinForm } from "@/components/PinForm";

type Props = {
  searchParams: Promise<{ pin_error?: string }>;
};

export default async function PrintPage({ searchParams }: Props) {
  const { pin_error } = await searchParams;
  const authed = await isAuthenticated();

  if (!authed) {
    return <PinForm returnTo="/admin/print" error={!!pin_error} />;
  }

  return (
    <AppShell>
      <PrintAdmin />
    </AppShell>
  );
}
