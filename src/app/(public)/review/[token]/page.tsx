import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ReviewForm } from "../../portal/ReviewForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Leave a Review" };

export default async function ReviewPage({
  params,
}: {
  params: { token: string };
}) {
  const review = await db.review.findUnique({
    where: { reviewToken: params.token },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      organization: { select: { name: true } },
    },
  });

  if (!review) notFound();

  if (review.rating) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Review Already Submitted</h1>
          <p className="mt-2 text-slate-500">Thank you for your feedback!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            How was your experience?
          </h1>
          <p className="mt-1 text-slate-500">
            {review.organization.name} would love your feedback.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Review for{" "}
              {review.customer
                ? `${review.customer.firstName} ${review.customer.lastName}`
                : "your recent service"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm reviewToken={params.token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
