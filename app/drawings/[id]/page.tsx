import DrawingReview from "@/components/DrawingReview";
export default function Page({ params }: { params: { id: string } }) {
  return <DrawingReview drawingId={params.id} />;
}
