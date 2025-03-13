"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuButton } from "@/components/menu-button";
import dynamic from "next/dynamic";

const navBarLinks = [
  {
    logoName: "logo-frame",
    text: "Create Shareable Blink",
    href: "/blink",
  },
  {
    logoName: "logo-readme",
    text: "Register project",
    href: "/project",
  },
  {
    logoName: "logo-globe",
    text: "Explore Actions",
    href: "/blinks",
  },
];

export const WalletButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
  },
);

export function Navbar() {
  return (
    <nav className="w-full px-4 py-3 flex justify-between items-center ">
      {/* RNP Logo */}
      <Link
        href="/"
        className="flex items-center h-[20px] w-[50px]"
      >
        <Image
          src="/rnp.png"
          alt="RNP Logo"
          width={50}
          height={20}
          className="object-contain"
        />
      </Link>

      {/* Social Links and Connect Button */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {navBarLinks.map((link) => (
            <MenuButton
              key={link.text}
              logoName={link.logoName}
              text={link.text}
              href={link.href}
            />
          ))}
        </div>
        <WalletButton />
      </div>
    </nav>
  );
}
