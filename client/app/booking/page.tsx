import BookingForm from "@/components/booking/BookingForm";
import BookingAuthGuard from "@/components/booking/BookingAuthGuard";

export default function Page() {
  return (
    <BookingAuthGuard>
      <main className="p-6 md:p-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Book a Ride
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Share your pickup & vehicle preference. We’ll confirm your driver/car
            request fast.
          </p>

          <div className="mt-6">
            <BookingForm />
          </div>
        </div>
      </main>
    </BookingAuthGuard>
  );
}







