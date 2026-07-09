"use client";

import { Alert } from "@/components/ui/primitives";
import { getAxiosErrorMessage } from "@/lib/api";

export default function AlertCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-4">
      <Alert tone="danger" title={title}>
        {description}
      </Alert>
    </div>
  );
}

export function ErrorTitleForStatus(status?: number) {
  if (status === 401) return "Invalid credentials";
  if (status === 403) return "Access denied";
  if (status === 404) return "Service not found";
  if (status === 500) return "Server error";
  return "Something went wrong";
}

export function errorDescriptionFromUnknown(error: unknown) {
  const message = getAxiosErrorMessage(error);

  const networkHints = [
    "Network Error",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "Failed to fetch",
    "timeout",
  ];

  if (
    typeof message === "string" &&
    networkHints.some((h) => message.toLowerCase().includes(h.toLowerCase()))
  ) {
    return "Please check your internet connection and try again.";
  }

  return message;
}

