import { useCallback, useMemo, useState } from "react";
import wordlist from "./assets/wordlists.json";
import {
  Box,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

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

const LessonSettings = ({
  lesson,
  mode,
  setLesson,
  setMode,
}: {
  lesson: number;
  mode: Mode;
  setLesson: (lesson: number) => void;
  setMode: (mode: Mode) => void;
}) => {
  return (
    <FormControl fullWidth>
      <Grid container spacing={2}>
        <Grid xs={6}>
          <Box sx={{ position: "relative" }}>
            <InputLabel id="lesson-select">Lesson</InputLabel>
            <Select
              sx={{ display: "block" }}
              labelId="lesson-select"
              id="mode-select"
              value={lesson}
              label="Lesson"
              onChange={(event) => {
                setLesson(Number(event.target.value));
              }}
            >
              {wordlist.map((entry) => (
                <MenuItem value={entry.lesson}>Lesson {entry.lesson}</MenuItem>
              ))}
            </Select>
          </Box>
        </Grid>
        <Grid xs={6}>
          <Box sx={{ position: "relative" }}>
            <InputLabel id="mode-select">Mode</InputLabel>
            <Select
              sx={{ display: "block" }}
              labelId="mode-select"
              id="mode-select"
              value={mode}
              label="Mode"
              onChange={(event) => {
                setMode(Number(event.target.value));
              }}
            >
              <MenuItem value={Mode.Learn}>{Mode[Mode.Learn]}</MenuItem>
              <MenuItem value={Mode.Check}>{Mode[Mode.Check]}</MenuItem>
            </Select>
          </Box>
        </Grid>
      </Grid>
    </FormControl>
  );
};

const Word = ({
  word,
  mode,
  checked,
  setChecked,
}: {
  word: Word;
  mode: Mode;
  checked: boolean;
  setChecked: (checked: boolean) => void;
}) => {
  return (
    <Box
      sx={{
        ...(mode === Mode.Check && {
          "& .translation": {
            visibility: "hidden",
          },
          "&:hover": {
            "& .translation": {
              visibility: "visible",
            },
          },
        }),
      }}
    >
      <Card variant="outlined" sx={{ position: "relative" }}>
        <CardContent>
          <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
            {word.english}
          </Typography>
          <Box className="translation">
            <Typography variant="h5" component="div">
              <Box>{word.dutch}</Box>
            </Typography>
            <Typography sx={{ mt: 1.5 }} color="text.secondary">
              <Box>{word.example}</Box>
              <Box>{word.translation}</Box>
            </Typography>
            <Box sx={{ position: "absolute", top: 5, right: 5 }}>
              <IconButton
                sx={{ fontSize: 44 }}
                onClick={() => setChecked(!checked)}
              >
                {checked ? (
                  <CheckCircleIcon
                    fontSize="inherit"
                    sx={{ color: "#16b06c" }}
                  />
                ) : (
                  <CheckCircleOutlineIcon
                    fontSize="inherit"
                    sx={{ color: "#ddd" }}
                  />
                )}
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export const App = () => {
  const [initialLesson] = useState(() => {
    const storedNumber = Number(localStorage.lesson);
    const allLessons = wordlist.map((entry) => entry.lesson);
    const latestLesson = Math.max(...allLessons);
    return storedNumber && allLessons.includes(storedNumber)
      ? storedNumber
      : latestLesson;
  });
  const [mode, _setMode] = useState(() => {
    const storedMode = Number(localStorage.mode);
    return Mode[storedMode] ? storedMode : Mode.Learn;
  });
  const [learntWords, _setLearntWords] = useState(() =>
    JSON.parse(localStorage.learntWords || "{}")
  );
  const [lesson, _setLesson] = useState(initialLesson);

  const isWordLearnt = useCallback(
    (word: Word) => learntWords[String(lesson)]?.includes(word.dutch),
    [lesson, learntWords]
  );

  const words = useMemo(() => {
    const { words } = wordlist.find((entry) => entry.lesson === lesson)!;
    return mode === Mode.Check
      ? words.filter((word) => !isWordLearnt(word))
      : words.sort((a, b) => isWordLearnt(a) - isWordLearnt(b));
  }, [mode, lesson, isWordLearnt]);

  const setWordLearnt = useCallback(
    (word: string, isLearnt: boolean) => {
      let lessonWords = Array.from(
        new Set([...(learntWords[String(lesson)] || []), word])
      );
      if (!isLearnt) {
        lessonWords = lessonWords.filter((w) => w !== word);
      }
      const newLearntWords = { ...learntWords, [String(lesson)]: lessonWords };
      localStorage.learntWords = JSON.stringify(newLearntWords);
      _setLearntWords(newLearntWords);
    },
    [lesson, learntWords]
  );

  const setMode = useCallback((mode: Mode) => {
    localStorage.mode = mode;
    _setMode(mode);
  }, []);

  const setLesson = useCallback((lesson: number) => {
    localStorage.lesson = lesson;
    _setLesson(lesson);
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ flexGrow: 1, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid xs={12}>
            <LessonSettings
              lesson={lesson}
              mode={mode}
              setLesson={setLesson}
              setMode={setMode}
            />
            <Box sx={{ marginTop: 2 }}>
              <Grid container spacing={2}>
                {words.map((word) => (
                  <Grid xs={12}>
                    <Word
                      word={word}
                      mode={mode}
                      checked={isWordLearnt(word)}
                      setChecked={(isLearnt) =>
                        setWordLearnt(word.dutch, isLearnt)
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
