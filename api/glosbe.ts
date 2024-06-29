const respondWithJson = (json: Record<string, unknown>) =>
  new Response(JSON.stringify(json), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });

const transformWord = (word: string) => {
  // Just trim it
  word = word.trim();
  // Remove articles
  word = word.replace(/\b(^(de|het)) /, "");
  // Remove parentheses if the word starts with them e.g. (na)tuurlijk
  if (word.indexOf("(") === 0) {
    word = word.replace("(", "").replace(")", "");
  }
  // Jet everything before the alternative word e.g. spekjes (het spekje)
  if (word.indexOf(" (") > 0) {
    word = word.split(" (")[0];
  }
  return word;
};

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const word = url.searchParams.get("word");

  if (!word) {
    return respondWithJson({ mp3: null });
  }

  const mp3 = await fetch(
    `https://glosbe.com/api/audios/nl/${encodeURIComponent(
      transformWord(word)
    )}`
  )
    .then((r) => r.json())
    .then(
      (r) =>
        `https://glosbe.com/fb_aud/mp3/${r.phraseAudioCarrier.audioEntries[0].url.mp3}`
    );

  return respondWithJson({ mp3 });
};
