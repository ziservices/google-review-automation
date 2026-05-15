import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import QRCodeCard from "@/components/QRCodeCard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: business,
    error,
  } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_email", user.email?.toLowerCase())
    .maybeSingle();

  if (!business || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">

          <h1 className="text-3xl font-bold text-white mb-4">
            No business attached to this account
          </h1>

          <p className="text-red-400 text-sm mb-2">
            Logged in as: {user.email}
          </p>

          <pre className="text-red-500 text-xs max-w-xl overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>

        </div>
      </div>
    );
  }

  /* ANALYTICS */

  const { data: feedbacks } = await supabase
    .from("feedback")
    .select("*")
    .eq("business_id", business.id);

  const totalFeedback = feedbacks?.length || 0;

  const positiveFeedback =
    feedbacks?.filter((f) => f.rating >= 4).length || 0;

  const negativeFeedback =
    feedbacks?.filter((f) => f.rating <= 3).length || 0;

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">

          <h1 className="text-4xl font-bold mb-2">
            {business.name}
          </h1>

          <p className="text-gray-500">
            Welcome back, {user.email}
          </p>

        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-2">
              Plan
            </h2>

            <p className="text-3xl font-bold capitalize">
              {business.plan}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-2">
              Status
            </h2>

            <p className="text-3xl font-bold">
              {business.is_active ? "Active" : "Inactive"}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-2">
              Total Reviews
            </h2>

            <p className="text-3xl font-bold">
              {totalFeedback}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-green-600">
              Positive
            </h2>

            <p className="text-3xl font-bold text-green-600">
              {positiveFeedback}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-red-600">
              Negative
            </h2>

            <p className="text-3xl font-bold text-red-600">
              {negativeFeedback}
            </p>
          </div>

        </div>

        {/* REVIEW URL */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

          <h2 className="text-lg font-semibold mb-3">
            Review URL
          </h2>

          <p className="text-sm break-all text-blue-600">
            {process.env.NEXT_PUBLIC_APP_URL}/review/{business.custom_url_slug}
          </p>

        </div>

        {/* QR CODE SECTION */}
        <QRCodeCard
          businessName={business.name}
          slug={business.custom_url_slug}
        />

      </div>

    </main>
  );
}