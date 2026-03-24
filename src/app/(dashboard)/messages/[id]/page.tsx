"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
interface MessageWithSender {
  id: string;
  body: string;
  direction: "INBOUND" | "OUTBOUND";
  createdAt: Date | string;
  sentBy: { id: string; name: string | null } | null;
}

interface Thread {
  id: string;
  channel: string;
  messages: MessageWithSender[];
  customer: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null } | null;
  lead: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null } | null;
}

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.id as string;
  const bottomRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/messages/${threadId}`)
      .then((r) => r.json())
      .then((d) => {
        setThread(d.thread);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  const contact = thread?.customer ?? thread?.lead;
  const contactName = contact ? `${contact.firstName} ${contact.lastName}` : "Unknown";

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !thread) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          customerId: thread.customer?.id,
          leadId: thread.lead?.id,
          channel: thread.channel,
          body: messageText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setThread((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, data.message] }
          : prev
      );
      setMessageText("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!thread) {
    return <p className="text-slate-500">Thread not found.</p>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-4">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar name={contactName} size="sm" />
        <div>
          <p className="font-medium text-slate-900">{contactName}</p>
          <p className="text-xs text-slate-500">{thread.channel} · {contact?.phone ?? contact?.email ?? "—"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {thread.messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-12">No messages yet.</p>
        )}
        {thread.messages.map((msg) => {
          const isOutbound = msg.direction === "OUTBOUND";
          return (
            <div key={msg.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm ${isOutbound ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                <p>{msg.body}</p>
                <p className={`mt-1 text-xs ${isOutbound ? "text-blue-200" : "text-slate-400"}`}>
                  {formatDateTime(msg.createdAt)}
                  {isOutbound && msg.sentBy && ` · ${msg.sentBy.name}`}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={`Type a ${thread.channel === "SMS" ? "text" : thread.channel.toLowerCase()}…`}
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" disabled={sending || !messageText.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
