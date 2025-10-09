"use client";

import React, { useEffect, useRef, useState } from "react";

import ChatMessage from "@/components/chat-message";
import AutosizeTextarea from "@/components/ui/autosize-textarea";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import { CoreMessage } from "@/lib/types";

async function streamChatResponse(
  history: CoreMessage[],
  onChunk?: (chunk: string) => void
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ history }),
  });

  if (!res.body) throw new Error("No response body from server.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    accumulated += chunk;

    if (onChunk) onChunk(chunk);
  }

  reader.releaseLock();
  return accumulated;
}

export default function PublicChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLUListElement>(null);
  const initRef = useRef(false); // prevent double init in dev

  // Auto-scroll on messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle user sending message
  async function handleGenerate(
    e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent
  ) {
    e.preventDefault();
    if (!input || isLoading) return;

    const userMsg: CoreMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Temporary loading message
    const loadingMsg: CoreMessage = {
      id: "loading-msg",
      role: "model",
      content: "",
    };
    setMessages((prev) => [...prev, loadingMsg]);

    // Capture only the conversation history (exclude loading message)
    const history = [...messages, userMsg];

    await streamChatResponse(history, (chunk) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === "loading-msg"
            ? { ...msg, content: msg.content + chunk } // append chunk
            : msg
        )
      );
    });

    // Remove loading-msg ID (optional, or keep it with final content)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === "loading-msg" ? { ...msg, id: undefined } : msg
      )
    );

    setIsLoading(false);
  }

  // Initial message on mount
  useEffect(() => {
    if (initRef.current) return; // prevent double call
    initRef.current = true;

    async function init() {
      setIsLoading(true);

      const initialUserMsg: CoreMessage = {
        role: "user",
        content: "Introduce yourself in one short sentence.",
        id: "initial-msg",
      };

      const loadingMsg: CoreMessage = {
        id: "loading-msg",
        role: "model",
        content: "Typing...",
      };
      setMessages([initialUserMsg, loadingMsg]);

      await streamChatResponse([initialUserMsg], (chunk) => {
        setMessages([initialUserMsg, { role: "model", content: chunk }]);
      });

      // Remove loading-msg ID
      setMessages((prev) => prev.filter((msg) => msg.id !== "loading-msg"));

      setIsLoading(false);
    }

    init();
  }, []);

  return (
    <div className="flex flex-col w-full pt-4 mx-auto flex-1 h-full justify-between">
      <ul className="mb-4 space-y-4 overflow-y-auto" ref={scrollRef}>
        {messages
          .filter((msg) => msg.id !== "initial-msg")
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
