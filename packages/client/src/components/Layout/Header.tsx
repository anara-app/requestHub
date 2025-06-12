"use client";

import { twMerge } from "tailwind-merge";
import Container from "../Container";
import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isMobileMenuOpen] = useState(false);

  return (
    <div className={twMerge("bg-black py-4 md:py-8")}>
      <Container>Header</Container>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          style={{ height: "calc(100vh - 70px)" }}
          className="bg-black fixed top-[70px] left-0 w-dvw z-10"
        >
          <div className="text-white text-center px-4">mobile</div>
        </div>
      )}
    </div>
  );
}

interface LinkButtonProps {
  isSelected?: boolean;
  name?: string;
  href?: string;
}

function LinkButton({ isSelected, name, href = "#" }: LinkButtonProps) {
  return (
    <Link aria-label={name} href={href}>
      <div
        className={twMerge(
          "py-3 px-4 rounded-3xl leading-5",
          isSelected ? "bg-white text-black" : "bg-[#1F2021] text-white"
        )}
      >
        {name}
      </div>
    </Link>
  );
}
