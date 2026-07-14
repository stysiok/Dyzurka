import { DetailScreen } from '@/app/components/mirhi-app';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <DetailScreen id={id} />; }
