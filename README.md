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
**AI:** Google Gemini 3 Flash (generation) + Gemini 3 Pro (analysis)  
**Voice:** Gemini 2.5 Flash TTS with personality matching
**Styling:** Tailwind CSS  
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
├── components/
│   ├── ManifestorForm.tsx      # The Invocation interface
│   ├── InputForm.tsx            # The Vision (Director Mode)
│   ├── CastingDirector.tsx     # The Intimacy (Blind Date)
│   ├── FantasyDashboard.tsx    # Results display
│   └── ...
├── services/
│   └── geminiService.ts         # Gemini 3 integration
├── types.ts                     # TypeScript definitions
├── App.tsx                      # Main application
└── index.html                   # Entry point
```

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set your Gemini API key in `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```
3. Run the app: `npm run dev`
4. Open: `http://localhost:5173`

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
