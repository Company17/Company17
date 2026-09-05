import DrawingReview from "@/components/DrawingReview";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DrawingReview drawingId={id} />;
}
