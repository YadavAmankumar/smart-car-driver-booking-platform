import axios, { type AxiosError } from "axios";
import { clearSession, getSessionToken } from "@/lib/session";

export type BookingPayload = {
  customerName: string;
  mobileNumber: string;
  email?: string;
  serviceType: "Driver Only" | "Car with Driver";
  carType?: "AC" | "Non-AC";
  pickupLocation: string;
  dropLocation: string;
  bookingDate: string; // YYYY-MM-DD or ISO string
  pickupTime: string;
  estimatedHours?: number;
  estimatedKm?: number;
  paymentMethod: "Cash" | "UPI";
  notes?: string;
  // Frontend form includes additional fields like passengers;
  // backend currently does not validate/persist them.
};

export type BackendValidationError = {
  field?: string;
  message: string;
};

export type CreateBookingResponse = {
  success: boolean;
  message?: string;
  data: unknown;
};

export type GetBookingsResponse = {
  success: boolean;
  count?: number;
  data: Booking[];
};

type Booking = {
  _id?: string;
  customerName?: string;
  mobileNumber?: string;
  serviceType?: string;
  carType?: string;
  pickupLocation?: string;
  dropLocation?: string;
  bookingDate?: string;
  pickupTime?: string;
  paymentMethod?: string;
  bookingStatus?: string;
  notes?: string;
  createdAt?: string;
};


const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "http://localhost:5001/api/v1";

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) clearSession();
    return Promise.reject(error);
  },
);

function getAuthToken(): string | null {
  return getSessionToken();
}

export type EstimatePricingPayload = {
  pickupLocation: string;
  dropLocation: string;
  serviceType: "Driver Only" | "Car with Driver";
  carType?: "AC" | "Non-AC";
  estimatedHours?: number;
  estimatedKm?: number;
  bookingDate: string;
  pickupTime: string;
  paymentMethod: "Cash" | "UPI";
};

export type FareBreakdown = {
  baseFare?: number;
  distanceCharge?: number;
  waitingCharge?: number;
  airportCharge?: number;
  nightCharge?: number;
  weekendCharge?: number;
  gst?: number;
  estimatedTotal?: number;
};

export type EstimatePricingResponse = {
  success?: boolean;
  data?: {
    baseFare?: number;
    distanceCharge?: number;
    waitingCharge?: number;
    airportCharge?: number;
    nightCharge?: number;
    weekendCharge?: number;
    gst?: number;
    estimatedTotal?: number;
    distanceKm?: number;
    estimatedDuration?: number;
  };
  message?: string;
};

export async function estimatePricing(payload: EstimatePricingPayload) {
  const token = getAuthToken();

  const res = await api.post<EstimatePricingResponse>(
    "/pricing/estimate",
    payload,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    }
  );

  return res.data;
}

export type LocationSuggestion = { id: number; label: string; latitude: number; longitude: number };
export type LocationPoint = Pick<LocationSuggestion, "latitude" | "longitude">;

export async function searchLocations(query: string) {
  const token = getAuthToken();
  const res = await api.get<{ success: boolean; data: LocationSuggestion[] }>("/locations/search", { params: { q: query }, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  return res.data.data;
}

export async function getRouteDistance(pickup: LocationPoint, drop: LocationPoint) {
  const token = getAuthToken();
  const res = await api.post<{ success: boolean; data: { distanceKm: number; durationMinutes: number } }>("/locations/distance", { pickup, drop }, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  return res.data.data;
}

export type AdminPricingResponse = {
  success?: boolean;
  data?: {
    id?: string;
    isActive?: boolean;
    driverBaseFare?: number;
    driverHourlyRate?: number;
    driverExtraHourlyRate?: number;
    driverMinimumHours?: number;
    carDriverBaseFare?: number;
    acRatePerKm?: number;
    nonAcRatePerKm?: number;
    minimumKm?: number;
    extraKmCharge?: number;
    driverAllowance?: number;
    nightStay?: number;
    tollCharge?: number;
    stateTax?: number;
    localBaseFare?: number;
    localPerKmRate?: number;
    waitingChargePerMinute?: number;
    waitingGraceTimeMinutes?: number;
    airportCharge?: number;
    gstPercent?: number;
    nightChargePercent?: number;
    weekendChargePercent?: number;
    minimumFare?: number;
    nightChargeWindow?: { startHour?: number; endHour?: number };
  };
  message?: string;
};

export type AdminPricingUpdatePayload = {
  driverBaseFare?: number;
  driverHourlyRate?: number;
  driverExtraHourlyRate?: number;
  driverMinimumHours?: number;
  carDriverBaseFare?: number;
  acRatePerKm?: number;
  nonAcRatePerKm?: number;
  minimumKm?: number;
  extraKmCharge?: number;
  driverAllowance?: number;
  nightStay?: number;
  tollCharge?: number;
  stateTax?: number;
  localBaseFare?: number;
  localPerKmRate?: number;
  waitingChargePerMinute?: number;
  waitingGraceTimeMinutes?: number;
  airportCharge?: number;
  gstPercent?: number;
  nightChargePercent?: number;
  weekendChargePercent?: number;
  minimumFare?: number;
  nightChargeWindow?: { startHour?: number; endHour?: number };
};

export async function getAdminPricing() {
  const token = getAuthToken();
  const res = await api.get<AdminPricingResponse>("/pricing", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export async function updateAdminPricing(payload: AdminPricingUpdatePayload) {
  const token = getAuthToken();
  console.log("[pricing] PUT /pricing payload", payload);
  const res = await api.put<AdminPricingResponse>("/pricing", payload, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  console.log("[pricing] PUT /pricing response", res.data);
  return res.data;
}


export async function createBooking(payload: BookingPayload) {
  const token = getAuthToken();

  const res = await api.post<CreateBookingResponse>(
    "/bookings/",
    payload,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    }
  );

  return res.data;
}


export async function getAllBookings() {
  const token = getAuthToken();

  const res = await api.get<GetBookingsResponse>("/bookings/", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export type AdminGetBookingsResponse = GetBookingsResponse;

export async function getAdminBookings(params?: {
  status?: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  search?: string;
}) {
  const token = getAuthToken();
  const query: Record<string, string> = {};

  if (params?.status) query.status = params.status;
  if (params?.search) query.search = params.search;

  const res = await api.get<AdminGetBookingsResponse>("/admin/bookings", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    params: Object.keys(query).length ? query : undefined,
  });

  return res.data;
}

export type PatchAdminBookingStatusResponse = {
  success: boolean;
  message?: string;
  data: unknown;
};

export async function patchAdminBookingStatus(
  bookingId: string,
  bookingStatus: "Pending" | "Confirmed" | "Ongoing" | "Completed" | "Cancelled",
) {
  const token = getAuthToken();

  const res = await api.patch<PatchAdminBookingStatusResponse>(
    `/admin/bookings/${bookingId}/status`,
    { bookingStatus },
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );

  return res.data;
}

export type AssignBookingDriverCarResponse = {
  success: boolean;
  message?: string;
  data: unknown;
};

// Backend route: PUT /api/v1/bookings/:id/assign (admin)
export async function assignBookingDriverCar(
  bookingId: string,
  payload: { driverId?: string; carId?: string },
) {
  const token = getAuthToken();

  const res = await api.put<AssignBookingDriverCarResponse>(
    `/bookings/${bookingId}/assign`,
    payload,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );

  return res.data;
}



export type CustomerBookingsResponse = GetBookingsResponse;

export async function getCustomerBookings() {
  const token = getAuthToken();

  const res = await api.get<CustomerBookingsResponse>("/bookings/customer", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export type GetBookingByIdResponse = {
  success?: boolean;
  data: Booking;
};

export async function getBookingById(bookingId: string) {
  const token = getAuthToken();

  const res = await api.get<GetBookingByIdResponse>(`/bookings/${bookingId}`, {

    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export type CancelBookingResponse = {
  success: boolean;
  message?: string;
};

export type PaymentRecord = {
  _id?: string;
  bookingId?: unknown;
  customerId?: unknown;
  driverId?: unknown;
  amount?: number;
  paymentMethod?: "Cash" | "UPI" | string;
  paymentStatus?: string;
  bookingStatus?: string;
  transactionId?: string;
  verificationStatus?: string;
  remarks?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentConfig = {
  upiId: string;
  upiQrImageUrl: string;
  payeeName: string;
};

export async function getPaymentConfig() {
  const token = getAuthToken();
  const res = await api.get<{ success: boolean; data: PaymentConfig }>(
    "/payments/config",
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function getPaymentByBooking(bookingId: string) {
  const token = getAuthToken();
  const res = await api.get<{ success: boolean; data: PaymentRecord }>(
    `/payments/customer/${bookingId}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function submitUpiUtr(bookingId: string, transactionId: string) {
  const token = getAuthToken();
  const res = await api.post<{ success: boolean; message?: string; data: PaymentRecord }>(
    `/payments/customer/${bookingId}/upi-utr`,
    { transactionId },
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function getAdminPayments() {
  const token = getAuthToken();
  const res = await api.get<{ success: boolean; count?: number; data: PaymentRecord[] }>(
    "/payments/admin",
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function verifyAdminUpiPayment(paymentId: string, action: "approve" | "reject", remarks?: string) {
  const token = getAuthToken();
  const res = await api.post<{ success: boolean; message?: string; data: PaymentRecord }>(
    `/payments/admin/${paymentId}/verify-upi`,
    { action, remarks },
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export type DriverProfile = {
  id?: string;
  driverName?: string;
  phoneNumber?: string;
  experience?: number;
  status?: "Available" | "Busy" | string;
  accountProvisioned?: boolean;
};

export type DriverBooking = Booking & {
  totalAmount?: number;
  estimatedFare?: number;
  paymentStatus?: string;
  startedAt?: string;
  completedAt?: string;
  customer?: { name?: string; phone?: string };
  driver?: unknown;
  car?: { carName?: string; carNumber?: string; carType?: string; isAC?: boolean } | null;
  payment?: PaymentRecord | null;
};

export type DriverDashboardData = {
  driver: DriverProfile;
  summary: {
    assignedCount: number;
    todayCount: number;
    upcomingCount: number;
    completedCount: number;
    paidEarnings: number;
    pendingAmount: number;
  };
  assignedBookings: DriverBooking[];
  todayTrips: DriverBooking[];
  upcomingTrips: DriverBooking[];
  completedTrips: DriverBooking[];
  payments: PaymentRecord[];
};

export async function getDriverDashboard() {
  const token = getAuthToken();
  const res = await api.get<{ success: boolean; data: DriverDashboardData }>(
    "/drivers/me/dashboard",
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function getDriverBookings() {
  const token = getAuthToken();
  const res = await api.get<{ success: boolean; count?: number; data: DriverBooking[] }>(
    "/drivers/me/bookings",
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function updateDriverAvailability(status: "Available" | "Busy") {
  const token = getAuthToken();
  const res = await api.put<{ success: boolean; message?: string; data: DriverProfile }>(
    "/drivers/me/availability",
    { status },
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function updateDriverProfile(payload: Pick<DriverProfile, "driverName" | "phoneNumber" | "experience">) {
  const token = getAuthToken();
  const res = await api.put<{ success: boolean; message?: string; data: DriverProfile }>(
    "/drivers/me",
    payload,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function startDriverBooking(bookingId: string) {
  const token = getAuthToken();
  const res = await api.post<{ success: boolean; message?: string; data: DriverBooking }>(
    `/drivers/me/bookings/${bookingId}/start`,
    {},
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function completeDriverBooking(bookingId: string) {
  const token = getAuthToken();
  const res = await api.post<{ success: boolean; message?: string; data: DriverBooking }>(
    `/drivers/me/bookings/${bookingId}/complete`,
    {},
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function confirmDriverCashCollection(paymentId: string) {
  const token = getAuthToken();
  const res = await api.put<{ success: boolean; message?: string; data: PaymentRecord }>(
    `/payments/${paymentId}/cash-collected`,
    {},
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  return res.data;
}

export async function confirmDriverOnlinePayment(paymentId: string) {
  const token = getAuthToken();

  const res = await api.put<{ success: boolean; message?: string; data: PaymentRecord }>(
    `/payments/${paymentId}/online-confirmed`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return res.data;
}

export async function cancelBooking(bookingId: string) {
  const token = getAuthToken();
  const res = await api.post<CancelBookingResponse>(
    `/bookings/${bookingId}/cancel`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return res.data;
}

export type GetProfileResponse = {
  success?: boolean;
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
};

export async function getCustomerProfile() {
  const token = getAuthToken();

  const res = await api.get<GetProfileResponse>("/auth/profile", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export type UpdateCustomerProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
};

export type UpdateProfileResponse = {
  success?: boolean;
  message?: string;
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
};

export async function updateCustomerProfile(
  payload: UpdateCustomerProfilePayload,
) {
  const token = getAuthToken();

  const res = await api.put<UpdateProfileResponse>("/auth/profile", payload, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export function getAxiosErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  return err.response?.data?.message || err.message || "Request failed";
}


export function parseBackendValidationErrors(
  error: unknown
): BackendValidationError[] {
  const err = error as AxiosError<{
    success?: boolean;
    message?: string;
    errors?: BackendValidationError[];
  }>;

  const errors = err.response?.data?.errors;
  if (Array.isArray(errors)) return errors;
  return [];
}

// ---------------------------
// Admin Fleet (Cars) APIs
// Backend endpoints (server):
// GET    /api/v1/cars
// POST   /api/v1/cars
// GET    /api/v1/cars/:id
// PUT    /api/v1/cars/:id
// DELETE /api/v1/cars/:id
// ---------------------------

type Car = {
  _id?: string;
  carName?: string;
  carNumber?: string;
  carType?: string;
  isAvailable?: boolean;
};

export type GetCarsResponse = {
  success?: boolean;
  count?: number;
  data: Car[];
};

export type CreateCarPayload = {
  carName: string;
  carNumber: string;
  carType: "Petrol" | "Diesel" | "CNG" | "EV";
  isAvailable: boolean;
  isAC: boolean;
};


export type UpdateCarPayload = CreateCarPayload;

export type CreateCarResponse = {
  success: boolean;
  message?: string;
  data: Car;
};

export type UpdateCarResponse = {
  success?: boolean;
  message?: string;
  data: Car;
};

export type DeleteCarResponse = {
  success: boolean;
  message?: string;
};

export async function getAdminCars() {
  const token = getAuthToken();

  const res = await api.get<GetCarsResponse>("/cars", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export async function createCar(payload: CreateCarPayload) {
  const token = getAuthToken();

  const res = await api.post<CreateCarResponse>("/cars", payload, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export async function updateCar(carId: string, payload: UpdateCarPayload) {
  const token = getAuthToken();

  const res = await api.put<UpdateCarResponse>(`/cars/${carId}`, payload, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}

export async function deleteCar(carId: string) {
  const token = getAuthToken();

  const res = await api.delete<DeleteCarResponse>(`/cars/${carId}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  return res.data;
}
