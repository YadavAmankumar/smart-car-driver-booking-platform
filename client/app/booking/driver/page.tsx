import BookingAuthGuard from "@/components/booking/BookingAuthGuard";
import DriverOnlyBookingForm from "@/components/booking/DriverOnlyBookingForm";

export default function DriverOnlyBookingPage() {
  return <BookingAuthGuard><main className="p-6 md:p-10"><div className="mx-auto max-w-6xl"><DriverOnlyBookingForm /></div></main></BookingAuthGuard>;
}
