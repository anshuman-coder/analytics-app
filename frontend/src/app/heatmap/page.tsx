import { getHeatmapPages } from '@/lib/api';
import { cookies } from 'next/headers';
import HeatmapClient from '@/components/HeatmapClient';
import Link from 'next/link';

interface Props {
  searchParams: { page?: string };
}

export default async function HeatmapPage({ searchParams }: Props) {
  const token = cookies().get('auth_token')?.value;
  let pages: string[] = [];
  const initialPage = searchParams.page ?? '';

  try {
    pages = await getHeatmapPages(token);
  } catch {
    // backend not running; fall through to manual URL input
  }

  return (
    <>
      <Link href="/" className="back-link">← Back to Sessions</Link>
      <h1>Click Heatmap</h1>
      <HeatmapClient pages={pages} initialPage={initialPage} token={token} />
    </>
  );
}
