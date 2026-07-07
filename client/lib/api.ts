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

