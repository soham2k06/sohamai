import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { embed } from "@/lib/embed";
import { qdrant } from "@/lib/qdrant";
import { systemMessageContent } from "@/lib/constants";

interface QdrantChunk {
  id: string;
  text: string; // field to embed
  payload: {
    text: string; // original text content
    category: "project" | "experience" | "skill" | "arc" | "meta";
    subcategory?: string;
    project?: string;
    slug?: string;
    section?: string;
    project_type?: "main" | "extra";
    arc_phase?: string;
    tags: string[];
    source: string;
  };
}

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const systemPrompt = `${systemMessageContent}
You must ONLY answer using the provided context.
If the answer is not in the context, say "I don't know".`;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const history = body.history as {
      role: "assistant" | "user";
      content: string;
    }[];

    const latestMessage = history[history.length - 1]?.content ?? "Hello";

    // embed query
    const queryVector = await embed(latestMessage);

    // search Qdrant
    const searchResult = await qdrant.search("portfolio", {
      vector: queryVector,
      limit: 5,
    });

    const filteredResults = searchResult.filter((r) => {
      const p = r.payload as QdrantChunk["payload"];
      return p.category && (p.project || p.section || p.tags?.length);
    });

    // build context
    const context = filteredResults
      .map((r) => {
        const p = r.payload as QdrantChunk["payload"];
        const parts: string[] = [`Content: ${p.text}`];

        if (p.project) parts.push(`Project: ${p.project}`);
        if (p.section) parts.push(`Section: ${p.section}`);
        if (p.category) parts.push(`Category: ${p.category}`);
        if (p.subcategory) parts.push(`Subcategory: ${p.subcategory}`);
        if (p.project_type) parts.push(`Project Type: ${p.project_type}`);
        if (p.arc_phase) parts.push(`Arc Phase: ${p.arc_phase}`);
        if (p.tags?.length) parts.push(`Tags: ${p.tags.join(", ")}`);

        return parts.join("\n");
      })
      .join("\n\n");

    if (!context.trim()) return new Response("I don't know", { status: 200 });

    const trimmedHistory = history.slice(-2);

    // Build chat session
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: trimmedHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "model", // use "model" for gemini
        parts: [{ text: msg.content }],
      })),
    });

    const finalPrompt = `
${systemPrompt}

Context:
${context}

Question:
${latestMessage}
`;

    // Start streaming response
    const stream = await chat.sendMessageStream({
      message: finalPrompt,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text ?? "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Error in /api/chat:", errorMessage);
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}
