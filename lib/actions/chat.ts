"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { systemMessageContent } from "../constants";

export async function continueConversation(messages: CoreMessage[]) {
  const systemMessage: CoreMessage | null = systemMessageContent
    ? {
        role: "assistant",
        content: systemMessageContent,
      }
    : null;

  const result = await streamText({
    model: google("gemini-1.0-pro"),
    messages: systemMessage ? [systemMessage, ...messages] : messages,
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}
