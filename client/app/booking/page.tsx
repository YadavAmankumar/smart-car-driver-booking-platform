import BookingForm from "@/components/booking/BookingForm";
import { Card, CardContent, Badge } from "@/components/ui/primitives";

export default function Page() {
  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
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

          <aside className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Why book with us</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Clean UI, clear selections, and quick confirmations.
                    </p>
                  </div>
                  <Badge tone="blue">Fast booking</Badge>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-[#EFF6FF] text-[#1D4ED8]">
                      ✓
                    </span>
                    AC / Non-AC preference in one place
                  </li>
                  <li className="flex items-start gap-2">
                    <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-[#EFF6FF] text-[#1D4ED8]">
                      ✓
                    </span>
                    Driver Only or Car with Driver
                  </li>
                  <li className="flex items-start gap-2">
                    <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-[#EFF6FF] text-[#1D4ED8]">
                      ✓
                    </span>
                    Pickup time & location validation
                  </li>
                </ul>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tip
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    For best results, choose <span className="font-semibold">Car with Driver</span>
                    when you want AC/Non-AC to be applied.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-slate-900">We support</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="neutral">Cash</Badge>
                  <Badge tone="neutral">UPI</Badge>
                  <Badge tone="neutral">Card</Badge>
                  <Badge tone="neutral">Net Banking</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Payment method selection will be sent with your booking request.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}


