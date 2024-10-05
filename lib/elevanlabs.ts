import { ElevenLabsClient } from "elevenlabs";
import { OptimizeStreamingLatency } from "elevenlabs/api";
import { Readable } from "stream";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

type TextToSpeechProps = {
  text: string;
};

enum ElevenLabsVoice {
  MyVoice = "TNHbwIMY5QmLqZdvjhNn", // Leo's voice (Indian Accent English)
}

enum ElevenLabsModel {
  MultilingualV2 = "eleven_multilingual_v2",
  TurboV2 = "eleven_turbo_v2",
}

export async function textToSpeech({
  text,
}: TextToSpeechProps): Promise<Readable> {
  const voiceId = ElevenLabsVoice.MyVoice;
  const modelId = ElevenLabsModel.TurboV2;

  const audioStream = await elevenlabs.generate({
    stream: true,
    voice: voiceId,
    text,
    model_id: modelId,
    optimize_streaming_latency: OptimizeStreamingLatency.Three,
    voice_settings: {
      stability: 0.7,
      similarity_boost: 1.0,
      style: 0.5,
      use_speaker_boost: true,
    },
  });
  return audioStream;
}
