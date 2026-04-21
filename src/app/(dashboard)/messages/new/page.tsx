"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export default function NewMessagePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    recipientType: "customer" as "customer" | "lead",
    recipientId: "",
    channel: "EMAIL" as "EMAIL",
    subject: "",
    body: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?page=1&pageSize=1000").then(r => r.json()),
      fetch("/api/leads?page=1&pageSize=1000").then(r => r.json()),
    ]).then(([customersData, leadsData]) => {
      setCustomers(customersData.customers || []);
      setLeads(leadsData.leads || []);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load recipients");
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const payload = {
        [formData.recipientType === "customer" ? "customerId" : "leadId"]: formData.recipientId,
        channel: formData.channel,
        subject: formData.channel === "EMAIL" ? formData.subject : undefined,
        body: formData.body,
      };

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data = await response.json();
      router.push(`/messages/${data.threadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const selectedRecipient = formData.recipientType === "customer"
    ? customers.find(c => c.id === formData.recipientId)
    : leads.find(l => l.id === formData.recipientId);

  const hasContactInfo = selectedRecipient?.["email"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/messages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Messages
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Message</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="recipientType">Recipient Type</Label>
            <Select
              value={formData.recipientType}
              onValueChange={(value: "customer" | "lead") =>
                setFormData(prev => ({ ...prev, recipientType: value, recipientId: "" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recipient">Recipient</Label>
            <Select
              value={formData.recipientId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, recipientId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {(formData.recipientType === "customer" ? customers : leads).map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    {recipient.firstName} {recipient.lastName}
                    {recipient.email && ` (${recipient.email})`}
                    {recipient.phone && ` (${recipient.phone})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="channel">Channel</Label>
          <Select
            value={formData.channel}
            onValueChange={(value: "EMAIL") =>
              setFormData(prev => ({ ...prev, channel: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.channel === "EMAIL" && (
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Message subject"
            />
          </div>
        )}

        <div>
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            placeholder="Type your message here..."
            rows={4}
          />
        </div>

        {selectedRecipient && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              Sending to: {selectedRecipient.firstName} {selectedRecipient.lastName}
            </p>
            {formData.channel === "SMS" && selectedRecipient.phone && (
              <p className="text-blue-700 text-sm">Phone: {selectedRecipient.phone}</p>
            )}
            {formData.channel === "EMAIL" && selectedRecipient.email && (
              <p className="text-blue-700 text-sm">Email: {selectedRecipient.email}</p>
            )}
            {!hasContactInfo && (
              <p className="text-yellow-700 text-sm mt-1">
                No {formData.channel === "SMS" ? "phone number" : "email address"} on file.
              </p>
            )}
          </div>
        )}

        {selectedRecipient && !hasContactInfo && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              Warning: Selected recipient does not have a {formData.channel === "SMS" ? "phone number" : "email address"} on file.
              The message may not be delivered.
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={sending || !formData.recipientId || !formData.body}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}