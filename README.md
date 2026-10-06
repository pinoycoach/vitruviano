# Vitruviano

**Everyone has a type. What if we could show you yours?**

Built for the [Gemini 3 Global Hackathon](https://gemini3-hackathon.devpost.com/)

---

## The Story

In 1490, Leonardo da Vinci created the Vitruvian Man to prove perfect beauty was mathematical. He defined ideal male proportions but could never test if humans actually preferred them.

Vitruviano completes his experiment using Gemini 3 and modern preference data.

My father gave me a da Vinci notebook before he passed away. Years later, I walked through Florence where da Vinci created this theory. As a photographer who spent 30 years studying human beauty, I finally had a way to test what da Vinci theorized.

---

## What It Does

Vitruviano generates romance archetypes using three modes:

### 🔮 The Invocation
Paste a book character description - we extract physical traits and manifest them using da Vinci's proportions.

### 💫 The Intimacy  
Audio-first blind date experience with voice personality matching.

### 🎬 The Vision
Full director control - customize every detail of your archetype.

Every interaction captures preference signals. We're building the world's first dataset of male aesthetic preferences mapped to mathematical proportions.

---

## Technical Architecture

**Frontend:** React + TypeScript + Vite  
**AI:** Google Gemini (text, images, TTS, Live voice); model names live in `config/models.ts`  
**Voice:** Gemini TTS with personality matching, ElevenLabs for WhisperBack  
**Backend:** Vercel serverless functions in `/api` (all API keys stay server-side)  
**Styling:** Tailwind CSS v4  
**Deployment:** Vercel

**Core Innovation:**  
We use Gemini 3 throughout the pipeline:
1. **Text Understanding**: Parse character descriptions and extract traits
2. **Image Generation**: Create images constrained by Vitruvian proportions
3. **Voice Synthesis**: Match personality to archetype with Gemini TTS
4. **Pattern Analysis**: Analyze aggregated preference patterns

---

## The Experience

**Cinematic UI Design:**
- Black background with gold accents (da Vinci's palette)
- Elegant Cormorant Garamond typography
- Slow fade animations for dramatic reveals
- "Everyone has a type" - the core question we're answering

**Three Pathways to Discovery:**
- **The Invocation**: Manifest your obsession from text
- **The Intimacy**: Discover through voice-first mystery
- **The Vision**: Direct your perfect archetype

---

## The Data

After [X] users and [Y] preference signals, we're discovering:
- Which archetypes drive the highest engagement
- How modern preferences align (or deviate) from classical proportions
- Demographic patterns in aesthetic preference
- Real-time trend analysis for fashion and romance industries

This becomes market intelligence for fashion brands and romance publishers.

---

## Project Structure

```
vitruviano/
├── api/                         # Vercel serverless functions (server-only, hold all keys)
│   ├── _lib/                    # shared helpers (http, gemini, fal, superuser session, prompts)
│   ├── whisper/                 # ElevenLabs script + voice
│   └── *.ts                     # profile, image, tts, hook, chat, live-token, superuser, ...
├── components/                  # React UI
├── config/
│   ├── models.ts                # every third-party model name, in one place
│   └── superuser.ts             # client-side view of the server-verified superuser state
├── services/                    # browser clients that call /api (no keys)
├── tests/                       # Vitest suites
├── docs/                        # design notes / plans
├── types.ts                     # TypeScript definitions
├── App.tsx                      # Main application
└── index.html                   # Entry point
```

---

## Run Locally

**Prerequisites:** Node.js 22+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the server-only keys
   (`GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `FAL_KEY`, `SUPERUSER_SECRET`).
   Never prefix them with `VITE_`: that would bundle them into the public JavaScript.
3. Run the app: `npm run dev` (also serves `/api/*` locally)
4. Open: `http://localhost:3000`

Other scripts: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
and `npm run check` (all four). Press **Ctrl+Shift+S** in the app to open the
superuser login (the secret is checked server-side).

**Deploying on Vercel:** set the same environment variables in the project settings.

---

## The Vision

**Phase 1 (Current):** Consumer app capturing preference data  
**Phase 2 (Q2 2026):** B2B intelligence platform for fashion/romance  
**Phase 3 (Q3 2026):** API access for publishers, designers, brands

We're not just building an AI image generator. We're answering the question: "What type makes your heart race?"

And using that answer to bridge Renaissance mathematics with modern data science.

---

## Built By

**Cash Harrington**  
Photographer | AI Builder | Completing my father's gift

57 years old. 30 years studying beauty. Ready to prove people my age can still build in the AI era.

---

## For the Hackathon Judges

**Why Vitruviano stands out:**

1. **Authentic Story**: Not manufactured for the hackathon - this is personal legacy work
2. **Novel UX**: "Everyone has a type" - we're the first to make discovering it feel cinematic
3. **Technical Depth**: Multi-modal Gemini 3 usage (text, image, voice, analysis)
4. **Real Impact**: Market intelligence for $2B+ fashion/romance industries
5. **Beautiful Execution**: Cinematic UI that honors da Vinci's aesthetic sensibility

**Gemini 3 Features Used:**
- Natural language understanding (character extraction)
- Constrained image generation (Vitruvian proportions)
- Voice synthesis with personality matching
- Pattern analysis across user preferences
- Multi-modal content generation

---

## Links

- **Live App**: [vitruviano.app](https://vitruviano.app)
- **Demo Video**: [YouTube Link]
- **Hackathon Submission**: [Devpost Link]

---

## License

MIT License - Built with ❤️ in honor of my father and Leonardo da Vinci

---

*"Everyone has a type. What if we could show you yours?"*
