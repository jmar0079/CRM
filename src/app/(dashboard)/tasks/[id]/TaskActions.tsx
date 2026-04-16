"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckSquare, Play, Loader2 } from "lucide-react";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

export default function TaskActions({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: TaskStatus) {
    setLoading(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {currentStatus === "PENDING" && (
        <Button variant="outline" size="sm" onClick={() => updateStatus("IN_PROGRESS")} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Start
        </Button>
      )}
      {currentStatus !== "COMPLETED" && (
        <Button size="sm" onClick={() => updateStatus("COMPLETED")} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
          Complete
        </Button>
      )}
    </div>
  );
}
