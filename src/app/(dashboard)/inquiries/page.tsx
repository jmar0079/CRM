"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Inquiry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  serviceName: string;
  category?: string;
  description?: string;
  location?: string;
  urgency: string;
  status: string;
  createdAt: string;
  matchScore: number;
  contactedAt?: string;
  respondedAt?: string;
  leadId?: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await fetch("/api/inquiries");
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateInquiry = async (inquiryId: string, action: string, leadId?: string) => {
    setUpdating(inquiryId);
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, leadId })
      });

      if (response.ok) {
        await fetchInquiries(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update inquiry:", error);
    } finally {
      setUpdating(null);
    }
  };

  const createLeadFromInquiry = async (inquiry: Inquiry) => {
    // Create a lead from the inquiry
    const leadData = {
      firstName: inquiry.firstName,
      lastName: inquiry.lastName,
      email: inquiry.email,
      phone: inquiry.phone,
      serviceInterest: inquiry.serviceName,
      notes: inquiry.description,
      address: inquiry.location,
      source: "INQUIRY" as const,
      sourceDetail: `Service inquiry for ${inquiry.serviceName}`
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...leadData, skipDuplicateCheck: true })
      });

      if (response.ok) {
        const { lead } = await response.json();
        await updateInquiry(inquiry.id, "create_lead", lead.id);
        router.push(`/leads/${lead.id}`);
      }
    } catch (error) {
      console.error("Failed to create lead:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service Inquiries</h1>
        <p className="text-muted-foreground">
          Customers looking for services that match your offerings
        </p>
      </div>

      <div className="grid gap-4">
        {inquiries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No inquiries yet. Inquiries will appear here when customers request services that match your offerings.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {inquiry.firstName} {inquiry.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {inquiry.email}
                      </div>
                      {inquiry.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {inquiry.phone}
                        </div>
                      )}
                      {inquiry.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {inquiry.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={
                      inquiry.urgency === "URGENT" ? "destructive" :
                      inquiry.urgency === "HIGH" ? "default" :
                      "secondary"
                    }>
                      {inquiry.urgency}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Match: {Math.round(inquiry.matchScore * 100)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Service Requested</h4>
                    <p className="text-sm text-muted-foreground">{inquiry.serviceName}</p>
                    {inquiry.category && (
                      <Badge variant="outline" className="mt-1">
                        {inquiry.category}
                      </Badge>
                    )}
                  </div>

                  {inquiry.description && (
                    <div>
                      <h4 className="font-medium">Description</h4>
                      <p className="text-sm text-muted-foreground">{inquiry.description}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {format(new Date(inquiry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>

                    <div className="flex gap-2">
                      {inquiry.leadId ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Converted to Lead
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          {inquiry.contactedAt ? (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Contacted
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInquiry(inquiry.id, "contact")}
                              disabled={updating === inquiry.id}
                            >
                              {updating === inquiry.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : null}
                              Contact
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => createLeadFromInquiry(inquiry)}
                            disabled={updating === inquiry.id}
                          >
                            {updating === inquiry.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Create Lead
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}