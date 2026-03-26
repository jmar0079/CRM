import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a friendly, concise help assistant built into a CRM (Customer Relationship Management) application. You help business owners understand and use the CRM effectively.

Here is how the CRM works:

**Leads**: When a potential customer fills out the booking form (shareable link), they appear as a Lead. Each lead has contact info, the service they're interested in, preferred date/time, and a status (NEW, CONTACTED, QUALIFIED, LOST). You can edit the lead, add notes, and convert them to a customer.

**Customers**: Once a lead is ready to work with, convert them to a Customer. This creates a customer profile with full history. You can manually add customers too.

**Quotes**: Quotes are auto-created when a lead comes in, or you can create one manually. A quote lists services/line items with prices. Statuses: DRAFT, SENT, ACCEPTED, DECLINED, EXPIRED. You can edit and send quotes to customers.

**Invoices**: Invoices are generated from accepted quotes, or created manually. Statuses: DRAFT, SENT, PAID, VOID. You can mark invoices as paid once payment is received.

**Services & Pricing** (Settings → Services): Add the services your business offers with name, description, price, and duration. These appear in the booking form.

**Booking Link** (Settings → Organization or Help page): Your unique booking link is for customers to fill out a request form. Share it on your website, social media, or via text/email.

**Tasks**: Create to-do tasks linked to customers or leads. Track as PENDING, IN_PROGRESS, or COMPLETED.

**Help Page**: Go to Help in the sidebar for quick-start guides and FAQ.

**Sign Out**: Click the logout button at the bottom of the sidebar.

Keep answers short and practical. If you don't know something specific about their data (like their customer names or invoice amounts), tell them you can only see general CRM information, not their specific records. Always be helpful and encouraging.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return NextResponse.json({ content: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Gemini error:", msg);
    const friendly = msg.includes("quota") || msg.includes("429")
      ? "AI quota exceeded — the API key needs to be activated in Google AI Studio."
      : msg.includes("404") || msg.includes("not found")
      ? "AI model not found — check the model name."
      : "AI request failed. Please try again.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
