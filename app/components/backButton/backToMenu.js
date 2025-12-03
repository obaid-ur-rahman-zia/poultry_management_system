"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ title, description }) {
  const router = useRouter();
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span
          onClick={() => router.back()}
          className="cursor-pointer text-black font-medium"
        >
          {title} Management
        </span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span>{description}</span>
      </div>
    </div>
  );
}
