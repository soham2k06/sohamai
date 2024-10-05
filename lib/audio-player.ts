export function playAudioFromResponse(
  response: Response,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  onAudioLoaded: () => void,
  onIsPlayingChange: (isPlaying: boolean) => void,
  onIsLoadingChange: (isLoading: boolean) => void
) {
  if (!MediaSource.isTypeSupported("audio/mpeg")) {
    throw new Error("Unsupported MIME type or codec: audio/mpeg");
  }

  const mediaSource = new MediaSource();
  const audio = new Audio();
  audio.src = URL.createObjectURL(mediaSource);
  audioRef.current = audio;

  mediaSource.addEventListener("sourceopen", () => {
    const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
    onAudioLoaded();
    readAudioChunks(response.body!.getReader(), sourceBuffer, mediaSource);
    onIsLoadingChange(false);
    onIsPlayingChange(true);
    audio.play();
  });

  audio.onended = () => {
    onIsPlayingChange(false);
    onIsLoadingChange(false);
  };

  audio.addEventListener("error", (e) => {
    console.error("Error playing audio", e);
  });
}

function readAudioChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  sourceBuffer: SourceBuffer,
  mediaSource: MediaSource
) {
  let queue: Uint8Array[] = [];
  let isAppendingInProgress = false;

  function processQueue() {
    if (queue.length > 0 && !sourceBuffer.updating) {
      sourceBuffer.appendBuffer(queue.shift()!);
    }
  }

  function push() {
    reader.read().then(({ done, value }) => {
      if (done) {
        mediaSource.endOfStream();
        return;
      }
      queue.push(value!);
      if (!isAppendingInProgress) {
        isAppendingInProgress = true;
        processQueue();
      }
      push();
    });
  }

  sourceBuffer.addEventListener("updateend", () => {
    isAppendingInProgress = false;
    processQueue();
  });

  push();
}
