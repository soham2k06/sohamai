import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { systemMessageContent } from "@/lib/constants";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const history = body.history as { role: string; content: string }[];

  // Build chat session
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
      {
        role: "model",
        content: systemMessageContent,
      },
      ...history,
    ].map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  });

  const firstMessage = history[history.length - 1]?.content ?? "Hello";

  // Start streaming response
  const stream = await chat.sendMessageStream({ message: firstMessage });

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
}
