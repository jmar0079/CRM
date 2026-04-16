"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ArrowLeft, Building2, Phone, Globe, MapPin, ChevronRight } from "lucide-react";

const SERVICE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Roofing",
  "Painting",
  "Cleaning",
  "Landscaping",
  "Carpentry",
  "Automotive",
  "Home Repair",
  "Appliance Repair",
  "Pest Control",
  "Other",
];

interface MatchingService {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
}

interface OrgResult {
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  matchingServices: MatchingService[];
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://crm1-gules.vercel.app";

export default function InquirePage() {
  const [service, setService] = useState("");
  const [category, setCategory] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<OrgResult[] | null>(null);
  const [error, setError] = useState("");

  // Pre-fill from customer session if present
  useEffect(() => {
    try { sessionStorage.getItem("customerInfo"); } catch (_) {}
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!service.trim() && !category) {
      setError("Please enter a service or select a category.");
      return;
    }
    setSearching(true);
    setError("");
    setResults(null);

    try {
      const params = new URLSearchParams();
      if (service.trim()) params.set("service", service.trim());
      if (category) params.set("category", category);

      const res = await fetch(`/api/public/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="font-semibold text-gray-900">ServiceFinder</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search section */}
        <div className="text-center mb-8">
          <Search className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Find a Service Provider</h1>
          <p className="mt-2 text-gray-600">
            Search for businesses near you and book directly with your chosen provider.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="service">What do you need?</Label>
                  <Input
                    id="service"
                    placeholder="e.g. roof repair, oil change, cleaning…"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category (optional)</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={searching}>
                {searching ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching…</>
                ) : (
                  <><Search className="mr-2 h-4 w-4" /> Search Providers</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {results !== null && (
          <div>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h2 className="text-lg font-semibold text-gray-700 mb-2">No providers found</h2>
                <p className="text-gray-500 text-sm">
                  Try a different keyword or category. More businesses are joining every day!
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {results.length} provider{results.length !== 1 ? "s" : ""} found
                </h2>
                <div className="space-y-4">
                  {results.map((org) => (
                    <Card key={org.slug} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <h3 className="font-semibold text-gray-900 text-base truncate">{org.name}</h3>
                            </div>

                            {org.matchingServices.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {org.matchingServices.slice(0, 3).map((svc) => (
                                  <span
                                    key={svc.id}
                                    className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                                  >
                                    {svc.name}
                                    {svc.price != null && (
                                      <span className="ml-1 text-blue-500">
                                        · ${svc.price.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                                      </span>
                                    )}
                                  </span>
                                ))}
                                {org.matchingServices.length > 3 && (
                                  <span className="text-xs text-gray-400">+{org.matchingServices.length - 3} more</span>
                                )}
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              {org.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {org.phone}
                                </span>
                              )}
                              {org.address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {org.address}
                                </span>
                              )}
                              {org.website && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" /> {org.website.replace(/^https?:\/\//, "")}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link href={`${APP_URL}/book?org=${org.slug}`} className="shrink-0">
                            <Button size="sm" className="whitespace-nowrap">
                              Book Now
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {results !== null && results.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t see the right fit?{" "}
              <button
                onClick={() => { setResults(null); setService(""); setCategory(""); }}
                className="text-blue-600 hover:underline font-medium"
              >
                Search again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}