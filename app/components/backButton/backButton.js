"use client";
import BackImg from "@/assets/home/Back.png";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      className="flex flex-row rotate-180 cursor-pointer"
      onClick={() => router.back()}
      type="button"
    >
      <Image src={BackImg} height={30} alt="back-img" />
    </button>
  );
}
