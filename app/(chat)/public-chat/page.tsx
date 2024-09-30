"use client";

import React, { useEffect } from "react";

import ChatMessage from "@/components/chat-message";
import { IMessageWithId } from "@/lib/types";
import { continueConversation } from "@/lib/actions/chat";
import { readStreamableValue } from "ai/rsc";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import AutosizeTextarea from "@/components/ui/autosize-textarea";

function PublicChatPage() {
  const [input, setInput] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);

  const [messages, setMessages] = React.useState<IMessageWithId[]>([]);

  const scrollRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleGenerate(
    e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent
  ) {
    e.preventDefault();

    if (isLoading) return;
    if (!input) return;

    const newMsg: IMessageWithId = { content: input, role: "user" };
    const newMessages: IMessageWithId[] = [...messages, newMsg];

    setMessages(newMessages);
    setInput("");

    setIsLoading(true);

    setMessages([
      ...newMessages,
      {
        id: "loading-msg",
        role: "assistant",
        content: "Typing...",
      },
    ]);

    const result = await continueConversation(newMessages, false);

    for await (const content of readStreamableValue(result)) {
      const newMessagesToPass = newMessages.filter(
        (msg) => msg.id !== "loading-msg"
      );

      setMessages([
        ...newMessagesToPass,
        {
          role: "assistant",
          content: content as string,
        },
      ]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function init() {
      const initialMessage: IMessageWithId = {
        id: "initial-msg",
        content: "Introduce yourself in one short sentence.",
        role: "user",
      };

      setIsLoading(true);

      setMessages([
        {
          id: "loading-msg",
          role: "assistant",
          content: "Typing...",
        },
      ]);

      const result = await continueConversation([initialMessage], false);

      for await (const content of readStreamableValue(result)) {
        setMessages([
          initialMessage,
          {
            role: "assistant",
            content: content as string,
          },
        ]);
      }

      setIsLoading(false);
    }

    init();
  }, []);

  return (
    <div className="flex flex-col w-full pt-4 mx-auto flex-1 h-full justify-between">
      <ul className="mb-4 space-y-4 overflow-y-auto" ref={scrollRef}>
        {messages
          .filter((msg) => (msg as IMessageWithId).id !== "initial-msg")
          .map((m, i) => (
            <ChatMessage key={i} msg={m} />
          ))}
      </ul>

      <form
        className="w-full max-w-3xl sticky bottom-0 mt-8 mx-auto shrink-0"
        onSubmit={handleGenerate}
      >
        <div className="relative">
          <AutosizeTextarea
            autoFocus
            className="w-full h-12 bg-secondary"
            value={input}
            placeholder="Say something..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate(e);
              }
            }}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            variant="outline"
            className="absolute top-1/2 -translate-y-1/2 right-2"
            size="icon"
            type="submit"
            disabled={!input || isLoading}
            loading={isLoading}
            loadingText=""
          >
            <ArrowUpIcon />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PublicChatPage;
