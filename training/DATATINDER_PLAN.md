# DataTinder — Plan

A local React app for reviewing and cleaning the training JSONL dataset.

## Key Decisions

**Reading the file** — `<input type="file">` picker. Browsers can't read arbitrary filesystem paths. One click, no server needed.

**Writing output** — Blob download via synthetic `<a>` click → `cleaned_data.jsonl` in Downloads. Always available, not just at the end.

**Resume support** — Full state persisted to `localStorage`. On reload: "Resume (450/2000 done)" or "Load new file".

**ChatGPT** — Direct `fetch()` to OpenAI API from the browser. API key stored in `localStorage` via a settings input. No proxy, no env vars. Local use only.

**Output format** — JSONL, same schema as input: `{"instruction", "input", "output"}`. Discarded entries are excluded.

---

## File Structure

```
/home/villehs/projects/DataTinder/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── FileLoader.jsx      # File input + resume prompt
    │   ├── EntryReviewer.jsx   # Input display + output textarea
    │   ├── ActionBar.jsx       # Keep / Discard / Ask ChatGPT buttons
    │   ├── ProgressBar.jsx     # N/2000, kept/discarded counts
    │   └── SettingsPanel.jsx   # API key input
    ├── hooks/
    │   └── useReviewState.js   # All state + actions
    └── utils/
        ├── parseJsonl.js
        ├── downloadJsonl.js
        └── openaiClient.js
```

---

## Data Flow

```
Load file → parse JSONL → save to localStorage → start at index 0

Per entry:
  Keep     → push {action:'keep',    entry: {instruction, input, output: textarea.value}}
  Discard  → push {action:'discard', entry}
  ChatGPT  → fetch OpenAI → fill textarea → user edits → Keep

  currentIndex++ → save to localStorage

Download → filter out discarded → serialize → cleaned_data.jsonl
```

---

## UI

- One entry visible at a time
- `instruction` field: collapsed/dimmed (same for all entries)
- `input` field: read-only, preformatted
- `output` field: editable `<textarea>`, pre-filled with existing output
- Progress bar: `[=====>     ] 654 / 2000 (32.7%) — 520 kept, 134 discarded`

**Keyboard shortcuts** (makes 2000-entry review survivable):
- `k` — Keep
- `d` — Discard
- `e` — Focus textarea for editing

---

## ChatGPT Integration

System prompt: Sakke's persona (short version from `train_lora.py`)
User message: the entry's `instruction` + `input`

Response fills the textarea. User still must press Keep to save it.

Model: `gpt-4o-mini` (fast + cheap for bulk use)

---

## Edge Cases

- Malformed JSONL lines → skip + show count
- API errors → show inline, don't crash
- Loading new file when progress exists → confirm dialog
- Empty `input` field → handle gracefully
