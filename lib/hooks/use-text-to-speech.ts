import { useCallback, useRef, useState } from "react";
import { playAudioFromResponse } from "../audio-player";

export const useTextToSpeech = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    setIsLoading(true);

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    playAudioFromResponse(
      response,
      audioRef,
      () => setAudioLoaded(true),
      (isPlaying) => setIsPlaying(isPlaying),
      (isLoading) => setIsLoading(isLoading)
    );
  }, []);

  return { speak, stop, audioLoaded, isPlaying, isLoading };
};
