"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  X,
} from "lucide-react";
import {
  createContext,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/25 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-[#2563EB] bg-[#2563EB] text-white shadow-sm hover:border-[#1D4ED8] hover:bg-[#1D4ED8]",
        secondary:
          "border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm hover:border-[#CBD5E1] hover:bg-[#F8FAFC]",
        ghost:
          "border-transparent bg-transparent text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
        danger:
          "border-[#DC2626] bg-[#DC2626] text-white shadow-sm hover:border-[#B91C1C] hover:bg-[#B91C1C]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-sm",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] shadow-sm transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] shadow-sm transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-md border border-[#E2E8F0] bg-white px-3 pr-9 text-sm text-[#0F172A] shadow-sm transition focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
      />
    </span>
  );
}

export function Checkbox({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] accent-[#2563EB] focus:ring-[#2563EB]",
        className,
      )}
      {...props}
    />
  );
}

export function Radio({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="radio"
      className={cn(
        "h-4 w-4 border-[#CBD5E1] text-[#2563EB] accent-[#2563EB] focus:ring-[#2563EB]",
        className,
      )}
      {...props}
    />
  );
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition",
        checked
          ? "border-[#2563EB] bg-[#2563EB]"
          : "border-[#CBD5E1] bg-[#E2E8F0]",
      )}
    >
      <span className="sr-only">{label ?? "Toggle setting"}</span>
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[#E2E8F0] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("border-b border-[#E2E8F0] p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-base font-semibold text-[#0F172A]", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("mt-1 text-sm text-[#64748B]", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]",
        blue: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
        green: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]",
        amber: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
        red: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [name],
  );

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#0F172A] text-xs font-semibold text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-56 -translate-x-1/2 rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#475569] shadow-lg group-hover:block">
        {label}
      </span>
    </span>
  );
}

export function Dropdown({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 top-10 z-30 min-w-48 rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/30 p-4">
      <div className="w-full max-w-lg rounded-lg border border-[#E2E8F0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] p-5">
          <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">Close modal</span>
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const Dialog = Modal;

export function Drawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/30">
      <aside className="h-full w-full max-w-md border-l border-[#E2E8F0] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] p-5">
          <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">Close drawer</span>
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#E2E8F0]", className)}
      {...props}
    />
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      aria-hidden="true"
      className={cn("h-4 w-4 animate-spin text-current", className)}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#94A3B8]">
        <AlertCircle aria-hidden="true" className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">{title}</h3>
      <p className="mt-1 text-sm text-[#64748B]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="flex items-center gap-2" aria-label="Pagination">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>
      <span className="text-sm text-[#64748B]">
        {page} of {totalPages}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </nav>
  );
}

export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {item.href ? (
            <a className="text-[#64748B] transition hover:text-[#0F172A]" href={item.href}>
              {item.label}
            </a>
          ) : (
            <span className="font-medium text-[#0F172A]">{item.label}</span>
          )}
          {index < items.length - 1 ? <span className="text-[#CBD5E1]">/</span> : null}
        </span>
      ))}
    </nav>
  );
}

const TabsContext = createContext<{
  value: string;
  setValue: (value: string) => void;
} | null>(null);

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const context = useContext(TabsContext);
  const active = context?.value === value;

  return (
    <button
      type="button"
      onClick={() => context?.setValue(value)}
      className={cn(
        "h-8 rounded px-3 text-sm font-medium transition",
        active ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]",
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children?: ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);

  if (context?.value !== value) {
    return null;
  }

  return <div className={className}>{children}</div>;
}

export function Accordion({
  items,
}: {
  items: Array<{ title: string; content: ReactNode }>;
}) {
  const [openItem, setOpenItem] = useState(0);

  return (
    <div className="divide-y divide-[#E2E8F0] rounded-lg border border-[#E2E8F0]">
      {items.map((item, index) => (
        <div key={item.title}>
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#0F172A]"
            onClick={() => setOpenItem(openItem === index ? -1 : index)}
          >
            {item.title}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-4 w-4 text-[#94A3B8] transition",
                openItem === index ? "rotate-180" : "",
              )}
            />
          </button>
          {openItem === index ? (
            <div className="px-4 pb-4 text-sm text-[#64748B]">{item.content}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function Alert({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  title: string;
  children: ReactNode;
}) {
  const toneClasses = {
    neutral: "border-[#E2E8F0] bg-white text-[#475569]",
    success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
    danger: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
  };

  return (
    <div className={cn("rounded-lg border p-4", toneClasses[tone])}>
      <div className="flex items-start gap-3">
        <Check aria-hidden="true" className="mt-0.5 h-4 w-4" />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="mt-1 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function IconButtonMenu() {
  return (
    <Button type="button" variant="ghost" size="icon">
      <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">Open menu</span>
    </Button>
  );
}
