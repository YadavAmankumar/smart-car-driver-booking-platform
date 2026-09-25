import BookingAuthGuard from "@/components/booking/BookingAuthGuard";
import ServiceSelection from "@/components/booking/ServiceSelection";

export default function Page() {
  return (
    <BookingAuthGuard>
      <main className="p-6 md:p-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Book a Ride
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Choose the service that fits your trip.
          </p>

          <div className="mt-6">
            <ServiceSelection />
          </div>
        </div>
      </main>
    </BookingAuthGuard>
  );
}






