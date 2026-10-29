-- Listen und Einstellungen: ein Datensatz pro Bereich (Gäste, To-dos, Getränke ...)
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Fotos (Location und Moodboard), verkleinert im Browser, max. ca. 1,8 MB
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at INTEGER NOT NULL
);
