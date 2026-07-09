"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full items-stretch justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                {subtitle ? (
                  <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

