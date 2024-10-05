import React from "react";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { IMessageWithId } from "@/lib/types";
import { useTextToSpeech } from "@/lib/hooks/use-text-to-speech";
import { Button } from "./ui/button";
import { SpeakerLoudIcon, StopIcon } from "@radix-ui/react-icons";
import LoadingIcon from "./loading";

function ChatMessage({ msg }: { msg: IMessageWithId }) {
  const isLoading = msg.id === "loading-msg";
  const {
    speak,
    stop,
    isLoading: isAudioLoading,
    isPlaying,
  } = useTextToSpeech();

  const handleToggleAudio = () =>
    isPlaying ? stop() : speak(msg.content as string);

  return (
    <li className="flex flex-col gap-2">
      <div
        className={cn(
          "max-w-3xl mx-auto w-full flex even:pb-4 items-start gap-2",
          {
            "flex-row-reverse": msg.role === "user",
          }
        )}
      >
        {msg.role === "assistant" && (
          <Avatar className="items-center bg-muted justify-center">
            <AvatarImage src="/soham-ai.png" alt="Soham" />
            <AvatarFallback>SB</AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn({
            "bg-muted text-foreground rounded-br-none p-2 rounded-lg":
              msg.role === "user",
            "py-2": msg.role === "assistant",
          })}
        >
          {isLoading ? (
            <div className="bg-muted-foreground size-6 rounded-full animate-pulse"></div>
          ) : (
            <Markdown className="leading-8 prose text-foreground/75">
              {msg.content as string}
            </Markdown>
          )}
        </div>
      </div>
      {msg.role === "assistant" && !isLoading && (
        <div className="max-w-3xl mx-auto w-full">
          <Button
            variant="secondary"
            className="font-semibold gap-2 min-w-24"
            size="sm"
            disabled={isAudioLoading}
            onClick={handleToggleAudio}
          >
            {isAudioLoading ? (
              <LoadingIcon />
            ) : isPlaying ? (
              <StopIcon />
            ) : (
              <SpeakerLoudIcon />
            )}{" "}
            {isPlaying ? "Stop" : "Speak"}
          </Button>
        </div>
      )}
    </li>
  );
}

export default ChatMessage;
