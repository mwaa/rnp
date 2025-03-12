"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

// Mock data for example blinks
const mockBlinks = Array(20).fill(null).map((_, i) => ({
  id: `blink-${i}`,
  title: [
    "Lend JLP on Kamino",
    "Lend jitoSOL on Kamino",
    "Lend PYUSD on Kamino",
    "Stake SOL with Marinade",
    "Provide Liquidity on Orca"
  ][i % 5],
  description: [
    "Earn on Kamino's JLP Market",
    "Earn on Kamino's Jito Market",
    "Earn on Kamino's Main Market",
    "Earn liquid staking rewards",
    "Earn trading fees and rewards"
  ][i % 5],
  icon: [
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JLPKGDk53mmKz8Y6j2RFcQUn9j7hGQM1scSex6BT3TN/logo.png",
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn/logo.png",
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/PYUSDKd5jYFNGm8FYYHHqHYZhJrCX1z8hEkaUkY8LYM/logo.png",
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png"
  ][i % 5],
  apy: (15 + Math.random() * 10).toFixed(2),
  tvl: (1000000 + Math.random() * 9000000).toFixed(0),
}));

export default function BlinksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredBlinks = mockBlinks.filter(blink => 
    blink.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blink.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate search delay
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-8">{mockBlinks.length} Blinks</h1>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <Input
              type="text"
              placeholder="Enter an Action URL to unfurl it into a Blink"
              className="pr-24 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit"
              className="absolute right-1 top-1 h-10"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Submit</span>
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlinks.map((blink) => (
            <Link key={blink.id} href="/">
              <Card className="group h-full bg-card hover:bg-accent transition-colors duration-200 cursor-pointer overflow-hidden">
                <div className="p-6 flex items-start gap-4">
                  <div className="shrink-0">
                    <img 
                      src={blink.icon} 
                      alt={blink.title}
                      className="w-12 h-12 rounded-full bg-white p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {blink.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {blink.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">APY:</span>
                        <span className="ml-1 font-medium text-green-500">
                          {blink.apy}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">TVL:</span>
                        <span className="ml-1 font-medium">
                          ${parseInt(blink.tvl).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}