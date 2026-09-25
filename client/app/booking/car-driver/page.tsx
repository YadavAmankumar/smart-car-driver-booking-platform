import BookingAuthGuard from "@/components/booking/BookingAuthGuard";
import CarWithDriverBookingForm from "@/components/booking/CarWithDriverBookingForm";

export default function CarWithDriverBookingPage() {
  return <BookingAuthGuard><main className="p-6 md:p-10"><div className="mx-auto max-w-6xl"><CarWithDriverBookingForm /></div></main></BookingAuthGuard>;
}
