import axios, { type AxiosError } from "axios";

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
  paymentMethod: "Cash" | "UPI" | "Card" | "Net Banking";
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

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  // Must match the key used in your login implementation.
  return localStorage.getItem("token");
}

export type EstimatePricingPayload = {
  pickupLocation: string;
  dropLocation: string;
  serviceType: "Driver Only" | "Car with Driver";
  carType?: "AC" | "Non-AC";
  estimatedHours?: number;
  bookingDate: string;
  pickupTime: string;
  paymentMethod: "Cash" | "UPI" | "Card" | "Net Banking";
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
  bookingStatus: "Pending" | "Confirmed" | "Completed" | "Cancelled",
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

export async function cancelBooking(bookingId: string) {
  void bookingId;

  // Backend currently only supports DELETE /api/bookings/:id (admin route).

  // Do not call it from customer UI.
  throw new Error(
    "Cancel booking is not supported for customer in backend APIs (DELETE is admin-protected)."
  );
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


