import BookingForm from "@/components/booking/BookingForm";

export default function Page() {
  return (
    <main className="p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Book a Ride
        </h1>
        <p className="mt-3 text-slate-600">
          Provide your details and we’ll confirm your driver/car request.
        </p>

        <div className="mt-8">
          <BookingForm />
        </div>
      </div>
    </main>
  );
}

