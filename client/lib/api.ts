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

