const respondWithJson = (json: Record<string, unknown>) =>
  new Response(JSON.stringify(json), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const word = url.searchParams.get("word");

  if (!word) {
    return respondWithJson({ mp3: null });
  }

  const mp3 = await fetch(
    `https://glosbe.com/api/audios/nl/${encodeURIComponent(word)}`
  )
    .then((r) => r.json())
    .then(
      (r) =>
        `https://glosbe.com/fb_aud/mp3/${r.phraseAudioCarrier.audioEntries[0].url.mp3}`
    );

  return respondWithJson({ mp3 });
};
