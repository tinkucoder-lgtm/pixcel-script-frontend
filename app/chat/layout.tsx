import { syncUser } from '@/lib/db/sync-user';

export default async function ChatLayout({
  children
}: {
  children: React.ReactNode
}) {
  await syncUser();
  return <>{children}</>;
}
