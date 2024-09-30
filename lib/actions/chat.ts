"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, streamText } from "ai";
import { createMessage } from "./messages";
import { google } from "@ai-sdk/google";
import { systemMessageContent } from "../constants";

export async function continueConversation(
  messages: CoreMessage[],
  storeToDB = true
) {
  const systemMessage: CoreMessage | null = systemMessageContent
    ? {
        role: "assistant",
        content: systemMessageContent,
      }
    : null;

  const result = await streamText({
    model: google("gemini-1.0-pro"),
    messages: systemMessage ? [systemMessage, ...messages] : messages,
    temperature: 0.5,

    async onFinish(event) {
      if (!storeToDB) return;
      const newMsg: CoreMessage = {
        content: event.text,
        role: "assistant",
      };
      await createMessage(newMsg);
    },
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}
