import { NextRequest } from "next/server";
import { Groq } from "groq-sdk";
import { embed } from "@/lib/embed";
import { qdrant } from "@/lib/qdrant";
import { systemMessageContent } from "@/lib/constants";
import { ChatCompletionUserMessageParam } from "groq-sdk/resources/chat/completions";

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

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `${systemMessageContent}
You must ONLY answer using the provided context.
If the answer is not in the context, say "I don't know".`;

type ApiErrorPayload = {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
};

function normalizeError(error: unknown): {
  status: number;
  payload: ApiErrorPayload;
} {
  const err = error as {
    message?: string;
    status?: number;
    code?: string;
    type?: string;
    error?: {
      message?: string;
      type?: string;
      code?: string;
    };
  };

  const message =
    err?.error?.message ??
    err?.message ??
    "Unexpected error while processing chat request.";

  const type = err?.error?.type ?? err?.type;
  const code = err?.error?.code ?? err?.code;

  const status =
    typeof err?.status === "number" && err.status >= 400 ? err.status : 500;

  return {
    status,
    payload: {
      error: {
        message,
        ...(type ? { type } : {}),
        ...(code ? { code } : {}),
      },
    },
  };
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

    const finalPrompt = `
${systemPrompt}

Context:
${context}

Question:
${latestMessage}
`;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        ...trimmedHistory.map((m) => ({
          role: (m.role === "user"
            ? "user"
            : "assistant") as ChatCompletionUserMessageParam["role"],
          content: m.content,
        })),
        {
          role: "user",
          content: finalPrompt,
        },
      ],
      stream: true,
      stop: null,
    });

    const readable = new ReadableStream({
      async start(controller) {
        let hasErrored = false;

        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0].delta.content ?? "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (err) {
          hasErrored = true;
          controller.error(err);
        } finally {
          if (!hasErrored) {
            controller.close();
          }
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
    const normalized = normalizeError(error);

    console.error("Error in /api/chat:", normalized.payload.error);

    return Response.json(normalized.payload, {
      status: normalized.status,
    });
  }
}
