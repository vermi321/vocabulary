import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import wordlist from "./assets/wordlists.json";
import {
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  IconButton,
  Icon,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

enum Mode {
  Learn = 1,
  Check = 2,
}

interface Word {
  dutch: string;
  english: string;
  example: string;
  translation: string;
}

const fetchGlosbeAudio = (() => {
  const cache = new Map();
  return (word: string) => {
    const mp3 = cache.get(word);
    if (mp3) {
      return Promise.resolve(mp3);
    }
    return fetch(`/api/glosbe?word=${encodeURIComponent(word)}`)
      .then((r) => r.json())
      .then(({ mp3 }) => {
        cache.set(word, mp3);
        return mp3;
      })
      .catch(() => {});
  };
})();

const LessonSettings = ({
  wordlist,
  lessonId,
  mode,
  showExamples,
  setLessonId,
  setMode,
  setShowExamples,
}: {
  wordlist: { lesson: number; topic: string; id: string }[];
  lessonId: string;
  mode: Mode;
  showExamples: boolean;
  setLessonId: (lessonId: string) => void;
  setMode: (mode: Mode) => void;
  setShowExamples: (showExamples: boolean) => void;
}) => {
  return (
    <Grid container spacing={2}>
      <Grid xs={6}>
        <FormControl fullWidth>
          <InputLabel id="lesson-select">Lesson</InputLabel>
          <Select
            sx={{ display: "block", overflowX: "hidden" }}
            labelId="lesson-select"
            id="mode-select"
            value={lessonId}
            label="Lesson"
            size="small"
            onChange={(event) => {
              setLessonId(event.target.value);
            }}
          >
            {wordlist.map((entry) => (
              <MenuItem key={entry.id} value={entry.id}>
                {entry.lesson}. {entry.topic}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={3}>
        <FormControl fullWidth>
          <InputLabel id="mode-select">Mode</InputLabel>
          <Select
            sx={{ display: "block", overflowX: "hidden" }}
            labelId="mode-select"
            id="mode-select"
            value={mode}
            label="Mode"
            size="small"
            onChange={(event) => {
              setMode(Number(event.target.value));
            }}
          >
            <MenuItem value={Mode.Learn}>{Mode[Mode.Learn]}</MenuItem>
            <MenuItem value={Mode.Check}>{Mode[Mode.Check]}</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid xs={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showExamples}
              onChange={(_, value) => setShowExamples(value)}
            />
          }
          label="Examples"
        />
      </Grid>
    </Grid>
  );
};

const Word = ({
  word,
  mode,
  showExamples,
  checked,
  setChecked,
  onPlay,
}: {
  word: Word;
  mode: Mode;
  showExamples: boolean;
  checked: boolean;
  setChecked: (checked: boolean) => void;
  onPlay: () => void;
}) => {
  const wordRef = useRef<HTMLElement>();
  const isActiveRef = useRef<boolean>(false);
  const [isActive, setActive] = useState(false);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (mode !== Mode.Check) return;
    const onMouseLeave = () => setActive(false);
    const onMouseMove = () => {
      if (!isActiveRef.current) {
        setActive(true);
      }
    };
    wordRef.current?.addEventListener("mousemove", onMouseMove);
    wordRef.current?.addEventListener("mouseleave", onMouseLeave);
    return () => {
      wordRef.current?.removeEventListener("mousemove", onMouseMove);
      wordRef.current?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [mode]);

  const sx = useMemo(
    () => ({
      position: "relative",
      "& .translation:hover": {
        cursor: "pointer",
        "& .pronounciation": {
          color: "#333",
        },
      },
      ...(mode === Mode.Check && {
        "& .translation, & .examples": {
          visibility: isActive ? "visible" : "hidden",
        },
      }),
    }),
    [mode, isActive]
  );

  return (
    <Box ref={wordRef} sx={sx}>
      <Grid container spacing={2}>
        <Grid xs={6}>
          <Typography>{word.english}</Typography>
        </Grid>
        <Grid xs={6}>
          <Box className="translation" onClick={onPlay}>
            <Typography sx={{ display: "flex", alignItems: "center" }}>
              <Box>{word.dutch}</Box>
              <Icon sx={{ fontSize: 24, marginLeft: "4px" }}>
                <PlayCircleOutlineIcon
                  className="pronounciation"
                  fontSize="inherit"
                  sx={{ color: "#ddd" }}
                />
              </Icon>
            </Typography>
          </Box>
        </Grid>
      </Grid>
      {showExamples && (
        <Typography
          color="text.secondary"
          className="examples"
          sx={{ fontSize: 12 }}
        >
          <Box>{word.example}</Box>
          <Box>{word.translation}</Box>
        </Typography>
      )}
      <Box sx={{ position: "absolute", top: 5, right: 0 }}>
        <IconButton
          size="small"
          sx={{
            fontSize: 24,
            color: checked ? "#16b06c" : "#ddd",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setChecked(!checked);
          }}
        >
          {checked ? (
            <CheckCircleIcon fontSize="inherit" />
          ) : (
            <CheckCircleOutlineIcon fontSize="inherit" />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export const App = () => {
  const wordsTransformed = useMemo(
    () =>
      wordlist.map((entry) => ({
        ...entry,
        id: `${entry.lesson}#${entry.topic}`,
      })),
    []
  );

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [mode, setMode] = useState(() => {
    const storedMode = Number(localStorage.mode);
    return Mode[storedMode] ? storedMode : Mode.Learn;
  });
  const [lessonId, setLessonId] = useState(() => {
    const storedLesson = localStorage.lessonId;
    const allLessons = wordsTransformed.map((entry) => entry.id);
    const latestLesson = wordsTransformed.slice(-1)[0].id;
    return storedLesson != null && allLessons.includes(storedLesson)
      ? storedLesson
      : latestLesson;
  });
  const [showExamples, setShowExamples] = useState(
    () => localStorage.examples !== "false"
  );
  const [learntWords, _setLearntWords] = useState(() =>
    JSON.parse(localStorage.learntWords || "{}")
  );

  const isWordLearnt = useCallback(
    (word: Word) => learntWords[lessonId]?.includes(word.dutch),
    [lessonId, learntWords]
  );

  const words = useMemo(() => {
    const { words } = wordsTransformed.find((entry) => entry.id === lessonId)!;
    return mode === Mode.Check
      ? words.filter((word) => !isWordLearnt(word))
      : words;
  }, [mode, lessonId, isWordLearnt]);

  const setWordLearnt = useCallback(
    (word: string, isLearnt: boolean) => {
      let lessonWords = Array.from(
        new Set([...(learntWords[String(lessonId)] || []), word])
      );
      if (!isLearnt) {
        lessonWords = lessonWords.filter((w) => w !== word);
      }
      const newLearntWords = {
        ...learntWords,
        [String(lessonId)]: lessonWords,
      };
      localStorage.learntWords = JSON.stringify(newLearntWords);
      _setLearntWords(newLearntWords);
    },
    [lessonId, learntWords]
  );

  useEffect(() => {
    localStorage.mode = mode;
    localStorage.lessonId = lessonId;
    localStorage.examples = showExamples;
  }, [mode, showExamples, lessonId]);

  const onPlay = useCallback(
    (word: Word) =>
      fetchGlosbeAudio(word.dutch).then(
        (mp3) => mp3 && setAudioSrc(`${mp3}?ts=${Date.now()}`)
      ),
    []
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ flexGrow: 1, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid xs={12}>
            <LessonSettings
              wordlist={wordsTransformed}
              lessonId={lessonId}
              mode={mode}
              showExamples={showExamples}
              setLessonId={setLessonId}
              setShowExamples={setShowExamples}
              setMode={setMode}
            />
            <Box sx={{ marginTop: 2 }}>
              <Grid container spacing={2}>
                {words.map((word) => (
                  <Grid xs={12} key={`${word.dutch}:${word.english}`}>
                    <Word
                      word={word}
                      mode={mode}
                      showExamples={showExamples}
                      checked={isWordLearnt(word)}
                      onPlay={() => onPlay(word)}
                      setChecked={(isLearnt) =>
                        setWordLearnt(word.dutch, isLearnt)
                      }
                    />
                  </Grid>
                ))}
                {audioSrc && (
                  <iframe
                    key={audioSrc}
                    title="pronounciation"
                    src={audioSrc}
                    allow="autoplay"
                    style={{ display: "none" }}
                  />
                )}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
