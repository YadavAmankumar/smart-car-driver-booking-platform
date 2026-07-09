"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQItem = {
  q: string;
  a: string;
};

const items: FAQItem[] = [
  {
    q: "What is the booking process?",
    a: "Choose your service, pick a date and time, enter pickup & drop details, then confirm. Dispatch will assign a professional driver based on availability.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes. Cancellation is supported based on your booking timing. If you need changes, contact support for assistance.",
  },
  {
    q: "How do payments work?",
    a: "Select a payment method during booking. We support common options for a smooth checkout experience.",
  },
  {
    q: "How do you ensure safety?",
    a: "We follow safety-first processes including driver verification, reliable dispatch, and consistent pickup coordination.",
  },
  {
    q: "Is the driver verified?",
    a: "Yes. Drivers go through verification steps and are matched to bookings to ensure a dependable experience.",
  },
  {
    q: "Do you offer refunds?",
    a: "Refunds depend on booking status and timing. If applicable, our support team will guide you through the process.",
  },
];

function FAQRow({ item, open, onToggle }: { item: FAQItem; open: boolean; onToggle: () => void }) {
  const detailsId = useId();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={open}
        aria-controls={detailsId}
      >
        <span className="text-sm font-semibold text-slate-900">{item.q}</span>
        <ChevronDown
          className={
            open
              ? "h-5 w-5 flex-none text-slate-500 transition-transform duration-200 rotate-180"
              : "h-5 w-5 flex-none text-slate-500 transition-transform duration-200"
          }
          aria-hidden="true"
        />
      </button>

      <div
        id={detailsId}
        className={open ? "mt-3 block" : "mt-3 hidden"}
        role="region"
        aria-label={item.q}
      >
        <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(1);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16" id="faq">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">FAQ</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Answers for a smoother ride
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Everything you need to know about booking, payments, and safety.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {items.map((item, idx) => (
          <FAQRow
            key={item.q}
            item={item}
            open={openIndex === idx}
            onToggle={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
          />
        ))}
      </div>
    </section>
  );
}

