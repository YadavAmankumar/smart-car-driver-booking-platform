"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  CalendarClock,
  Car,
  CheckCircle2,
  CreditCard,
  Gauge,
  MapPin,
  Navigation,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dropdown,
  EmptyState,
  IconButtonMenu,
  Input,
  LoadingSpinner,
  Pagination,
  Radio,
  Select,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  Tooltip,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit mobile number"),
  pickupLocation: z.string().min(3, "Pickup location is required"),
  dropLocation: z.string().min(3, "Drop location is required"),
  bookingDate: z.string().min(1, "Date is required"),
  pickupTime: z.string().min(1, "Pickup time is required"),
  serviceType: z.enum(["Driver Only", "Car with Driver"]),
  vehicleClass: z.string().min(1, "Vehicle class is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  tripSize: z.string().min(1, "Trip size is required"),
  notes: z.string().max(500).optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

const metrics = [
  {
    label: "Trips scheduled",
    value: "128",
    delta: "+14 today",
    icon: Route,
    tone: "blue",
  },
  {
    label: "Driver readiness",
    value: "94%",
    delta: "42 verified",
    icon: UserCheck,
    tone: "green",
  },
  {
    label: "Fleet utilization",
    value: "76%",
    delta: "18 cars active",
    icon: Gauge,
    tone: "amber",
  },
  {
    label: "Safety score",
    value: "99.2",
    delta: "No incidents",
    icon: ShieldCheck,
    tone: "green",
  },
] as const;

const drivers = [
  {
    name: "Rohan Mehta",
    role: "Executive chauffeur",
    rating: "4.96",
    eta: "8 min",
    status: "Ready",
    car: "Toyota Innova HyCross",
  },
  {
    name: "Imran Shaikh",
    role: "Airport specialist",
    rating: "4.92",
    eta: "12 min",
    status: "On route",
    car: "Honda City ZX",
  },
  {
    name: "Karan Rao",
    role: "Corporate trips",
    rating: "4.98",
    eta: "16 min",
    status: "Ready",
    car: "MG Hector Sharp",
  },
] as const;

const bookings = [
  {
    id: "BK-1048",
    customer: "Aarav S.",
    route: "Bandra West -> BKC",
    time: "09:40",
    status: "Confirmed",
  },
  {
    id: "BK-1049",
    customer: "Priya N.",
    route: "Andheri -> T2 Airport",
    time: "10:15",
    status: "Driver assigned",
  },
  {
    id: "BK-1050",
    customer: "Vikram M.",
    route: "Powai -> Lower Parel",
    time: "11:00",
    status: "Pending",
  },
] as const;

const fleet = [
  { label: "Premium sedan", available: 12, total: 18 },
  { label: "SUV comfort", available: 8, total: 14 },
  { label: "Executive van", available: 4, total: 6 },
] as const;

const navItems = [
  { label: "Dispatch", icon: Route },
  { label: "Bookings", icon: CalendarClock },
  { label: "Drivers", icon: UserCheck },
  { label: "Payments", icon: CreditCard },
  { label: "Reports", icon: Activity },
] as const;

export default function Home() {
  const [serviceType, setServiceType] =
    useState<BookingForm["serviceType"]>("Car with Driver");
  const [priorityDispatch, setPriorityDispatch] = useState(true);
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BookingForm>({
    defaultValues: {
      customerName: "",
      mobileNumber: "",
      pickupLocation: "",
      dropLocation: "",
      bookingDate: "",
      pickupTime: "",
      serviceType: "Car with Driver",
      vehicleClass: "Premium sedan",
      paymentMethod: "UPI",
      tripSize: "",
      notes: "",
    },
  });

  const readiness = useMemo(
    () => fleet.reduce((sum, item) => sum + item.available, 0),
    [],
  );

  function onSubmit(values: BookingForm) {
    const parsed = bookingSchema.safeParse({
      ...values,
      serviceType,
    });

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof BookingForm;
        setError(fieldName, { message: issue.message });
      });
      toast.error("Review the highlighted booking details.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Booking draft validated and ready for backend submission.");
      reset({
        customerName: "",
        mobileNumber: "",
        pickupLocation: "",
        dropLocation: "",
        bookingDate: "",
        pickupTime: "",
        serviceType,
        vehicleClass: "Premium sedan",
        paymentMethod: "UPI",
        tripSize: "",
        notes: "",
      });
    }, 500);
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="flex min-h-screen">
        <aside className="hidden w-20 shrink-0 border-r border-[#E2E8F0] bg-white px-3 py-5 lg:block">
          <div className="flex h-full flex-col items-center justify-between">
            <div className="space-y-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0F172A] text-white shadow-sm">
                <Car aria-hidden="true" className="h-5 w-5" />
              </div>
              <nav className="space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <Tooltip key={item.label} label={item.label}>
                      <button
                        type="button"
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-lg border transition",
                          index === 0
                            ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                            : "border-transparent text-[#64748B] hover:border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
                        )}
                      >
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </button>
                    </Tooltip>
                  );
                })}
              </nav>
            </div>
            <Avatar name="Aman Kumar" />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white">
            <div className="flex min-h-16 flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div>
                <Breadcrumb
                  items={[
                    { label: "SmartDrive" },
                    { label: "Operations" },
                    { label: "Dispatch" },
                  ]}
                />
                <h1 className="mt-2 text-2xl font-semibold text-[#0F172A]">
                  Driver booking command center
                </h1>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block min-w-0 sm:w-72">
                  <Search
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <Input className="pl-9" placeholder="Search booking, driver, route" />
                </label>
                <Tooltip label="Notifications">
                  <Button type="button" variant="secondary" size="icon">
                    <Bell aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                </Tooltip>
                <Button type="button">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  New booking
                </Button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: index * 0.04 }}
                >
                  <Card className="h-full">
                    <CardContent className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#64748B]">{metric.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-[#0F172A]">
                          {metric.value}
                        </p>
                        <Badge
                          className="mt-4"
                          tone={metric.tone === "blue" ? "blue" : metric.tone === "amber" ? "amber" : "green"}
                        >
                          {metric.delta}
                        </Badge>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#2563EB]">
                        <metric.icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Book a premium ride</CardTitle>
                    <CardDescription>
                      Validate trip details before sending the booking to your backend.
                    </CardDescription>
                  </div>
                  <Tabs defaultValue="car">
                    <TabsList>
                      <TabsTrigger value="car">Car + driver</TabsTrigger>
                      <TabsTrigger value="driver">Driver only</TabsTrigger>
                    </TabsList>
                    <TabsContent value="car" />
                    <TabsContent value="driver" />
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <fieldset className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0F172A]">Customer name</span>
                        <Input placeholder="e.g. Neha Kapoor" {...register("customerName")} />
                        {errors.customerName ? (
                          <FieldError>{errors.customerName.message}</FieldError>
                        ) : null}
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0F172A]">Mobile number</span>
                        <Input placeholder="9876543210" {...register("mobileNumber")} />
                        {errors.mobileNumber ? (
                          <FieldError>{errors.mobileNumber.message}</FieldError>
                        ) : null}
                      </label>
                    </fieldset>

                    <fieldset className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0F172A]">Pickup location</span>
                        <div className="relative">
                          <MapPin
                            aria-hidden="true"
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                          />
                          <Input
                            className="pl-9"
                            placeholder="Bandra West, Mumbai"
                            {...register("pickupLocation")}
                          />
                        </div>
                        {errors.pickupLocation ? (
                          <FieldError>{errors.pickupLocation.message}</FieldError>
                        ) : null}
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0F172A]">Drop location</span>
                        <div className="relative">
                          <Navigation
                            aria-hidden="true"
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                          />
                          <Input
                            className="pl-9"
                            placeholder="Terminal 2 Airport"
                            {...register("dropLocation")}
                          />
                        </div>
                        {errors.dropLocation ? (
                          <FieldError>{errors.dropLocation.message}</FieldError>
                        ) : null}
                      </label>
                    </fieldset>

                    <fieldset className="grid gap-3 md:grid-cols-4">
                      <label className="space-y-2 md:col-span-1">
                        <span className="text-sm font-medium text-[#0F172A]">Date</span>
                        <Input type="date" {...register("bookingDate")} />
                        {errors.bookingDate ? <FieldError>{errors.bookingDate.message}</FieldError> : null}
                      </label>
                      <label className="space-y-2 md:col-span-1">
                        <span className="text-sm font-medium text-[#0F172A]">Pickup time</span>
                        <Input type="time" {...register("pickupTime")} />
                        {errors.pickupTime ? <FieldError>{errors.pickupTime.message}</FieldError> : null}
                      </label>
                      <label className="space-y-2 md:col-span-1">
                        <span className="text-sm font-medium text-[#0F172A]">Vehicle class</span>
                        <Select {...register("vehicleClass")}>
                          <option>Premium sedan</option>
                          <option>SUV comfort</option>
                          <option>Executive van</option>
                        </Select>
                      </label>
                      <label className="space-y-2 md:col-span-1">
                        <span className="text-sm font-medium text-[#0F172A]">Payment</span>
                        <Select {...register("paymentMethod")}>
                          <option>UPI</option>
                          <option>Card</option>
                          <option>Cash</option>
                          <option>Net Banking</option>
                        </Select>
                      </label>
                    </fieldset>

                    <fieldset className="grid gap-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">Service type</p>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                          {["Car with Driver", "Driver Only"].map((value) => (
                            <label
                              key={value}
                              className="flex items-center gap-2 text-sm text-[#475569]"
                            >
                              <Radio
                                checked={serviceType === value}
                                onChange={() => setServiceType(value as BookingForm["serviceType"])}
                              />
                              {value}
                            </label>
                          ))}
                        </div>
                      </div>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[#0F172A]">
                          {serviceType === "Driver Only" ? "Estimated hours" : "Estimated distance"}
                        </span>
                        <Input
                          placeholder={serviceType === "Driver Only" ? "6 hours" : "34 km"}
                          {...register("tripSize")}
                        />
                        {errors.tripSize ? <FieldError>{errors.tripSize.message}</FieldError> : null}
                      </label>
                      <label className="flex items-center justify-between gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 py-3">
                        <span>
                          <span className="block text-sm font-medium text-[#0F172A]">
                            Priority dispatch
                          </span>
                          <span className="text-xs text-[#64748B]">Assign fastest verified driver</span>
                        </span>
                        <Toggle
                          checked={priorityDispatch}
                          onCheckedChange={setPriorityDispatch}
                          label="Priority dispatch"
                        />
                      </label>
                    </fieldset>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[#0F172A]">Trip notes</span>
                      <Textarea
                        placeholder="Airport gate, luggage count, preferred vehicle note"
                        {...register("notes")}
                      />
                    </label>

                    <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-center gap-2 text-sm text-[#475569]">
                        <Checkbox defaultChecked />
                        Share driver and safety details with customer
                      </label>
                      <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? <LoadingSpinner /> : <CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
                        Validate booking
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Route intelligence</CardTitle>
                      <CardDescription>Live-style dispatch preview for operations teams.</CardDescription>
                    </div>
                    <Badge tone="green">Low risk</Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="route-grid relative h-64 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                      <div className="absolute left-8 top-10 flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                        Pickup
                      </div>
                      <div className="absolute bottom-10 right-8 flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                        Drop
                      </div>
                      <div className="absolute left-20 top-28 h-0.5 w-[68%] rotate-[17deg] bg-[#2563EB]" />
                      <div className="absolute left-[52%] top-[48%] flex h-12 w-12 items-center justify-center rounded-lg bg-[#0F172A] text-white shadow-lg">
                        <Car aria-hidden="true" className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ["ETA", "38 min"],
                        ["Distance", "24.6 km"],
                        ["Fare band", "Premium"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-[#E2E8F0] p-3">
                          <p className="text-xs text-[#64748B]">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-[#0F172A]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Alert title="Backend integration ready" tone="neutral">
                  The form validates a booking draft locally and is structured to connect to
                  the existing `/api/v1/bookings` route when API integration is added.
                </Alert>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Dispatch queue</CardTitle>
                    <CardDescription>Bookings requiring driver and vehicle coordination.</CardDescription>
                  </div>
                  <Dropdown label="Today">
                    <button className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#475569] hover:bg-[#F8FAFC]">
                      Today
                    </button>
                    <button className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#475569] hover:bg-[#F8FAFC]">
                      Tomorrow
                    </button>
                    <button className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#475569] hover:bg-[#F8FAFC]">
                      This week
                    </button>
                  </Dropdown>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookings.map((booking) => (
                    <article
                      key={booking.id}
                      className="grid gap-4 rounded-lg border border-[#E2E8F0] p-4 md:grid-cols-[120px_1fr_auto] md:items-center"
                    >
                      <div>
                        <p className="text-xs text-[#64748B]">{booking.id}</p>
                        <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                          {booking.time}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{booking.customer}</p>
                        <p className="mt-1 text-sm text-[#64748B]">{booking.route}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Badge
                          tone={
                            booking.status === "Pending"
                              ? "amber"
                              : booking.status === "Confirmed"
                                ? "green"
                                : "blue"
                          }
                        >
                          {booking.status}
                        </Badge>
                        <IconButtonMenu />
                      </div>
                    </article>
                  ))}
                  <div className="flex justify-end">
                    <Pagination page={page} totalPages={4} onPageChange={setPage} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Driver shortlist</CardTitle>
                  <CardDescription>{readiness} vehicles available across premium classes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {drivers.map((driver) => (
                    <article
                      key={driver.name}
                      className="rounded-lg border border-[#E2E8F0] p-4 transition hover:border-[#CBD5E1] hover:shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={driver.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold text-[#0F172A]">
                              {driver.name}
                            </h3>
                            <Badge tone={driver.status === "Ready" ? "green" : "blue"}>
                              {driver.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-[#64748B]">{driver.role}</p>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[#64748B]">
                            <span className="rounded-md bg-[#F8FAFC] px-2 py-1">
                              {driver.rating} rating
                            </span>
                            <span className="rounded-md bg-[#F8FAFC] px-2 py-1">
                              {driver.eta}
                            </span>
                            <span className="rounded-md bg-[#F8FAFC] px-2 py-1">Verified</span>
                          </div>
                          <p className="mt-3 text-xs text-[#94A3B8]">{driver.car}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet availability</CardTitle>
                  <CardDescription>Class-level readiness for current dispatch window.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {fleet.map((item) => {
                    const width = Math.round((item.available / item.total) * 100);
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[#0F172A]">{item.label}</span>
                          <span className="text-[#64748B]">
                            {item.available}/{item.total}
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-2 rounded-full bg-[#2563EB]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <Accordion
                    items={[
                      {
                        title: "Dispatch quality rules",
                        content:
                          "Prioritize verified drivers, clean vehicle status, low cancellation history, and route familiarity.",
                      },
                      {
                        title: "Customer safety policy",
                        content:
                          "Share driver identity, car number, OTP confirmation, and support contact before pickup.",
                      },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System states</CardTitle>
                  <CardDescription>Reusable primitives for loading and empty workflows.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[#E2E8F0] p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-[#64748B]">
                      Use skeletons while bookings, cars, or driver assignments load.
                    </p>
                  </div>
                  <EmptyState
                    title="No delayed trips"
                    description="All scheduled pickups are inside the current service window."
                    action={
                      <Button type="button" variant="secondary" size="sm">
                        <Sparkles aria-hidden="true" className="h-4 w-4" />
                        View health
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function FieldError({ children }: { children?: string }) {
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-[#DC2626]">
      {children}
    </span>
  );
}
