# খুদে বিজ্ঞানী (Khude Biggani, "Little Scientist")

A **free, Bangla-first STEM playground for kids aged 7–14 in Bangladesh**: rockets, robots, coding, astronomy, energy and nature, taught through play. The guide is **তুহিন**, a friendly robot (named after the project's creator).

## Principles
- **Bangla first.** All text, numbers (০১২৩…) and voice are in Bangla. It is not a translation of English material.
- **Built for budget Android phones.** No images or videos; everything is drawn in code. It is a few hundred KB in total and works **offline** after the first visit, so it can be installed to the home screen.
- **Safe for children.** No ads, no login, no data collection. Progress is stored only on the device.
- **Local and hands-on.** Experiments use things found at home (balloon, string, straw), and examples come from Bangladeshi life.

## Every lesson has 5 steps
1. **গল্প (story):** তুহিন explains with a tappable demo
2. **খেলা (play):** a hands-on simulator
3. **বাসায় করে দেখো (try at home):** a cheap home experiment
4. **কুইজ (quiz):** three questions with friendly hints
5. **ব্যাজ (badge):** a badge, and a star lights up on the "star map"

## What's built
| File | What |
|---|---|
| `index.html` | Home: তুহিন (tap him!), the 6 learning worlds, the star map |
| `rocket.html` | Lesson 1, "রকেট কীভাবে ওড়ে?" (How does a rocket fly?): balloon demo → Newton's 3rd law → rocket launch simulator (fuel vs payload, thrust vs weight, missions up to the Kármán line) → balloon-rocket experiment → quiz → badge |
| `js/common.js` | তুহিন mascot (eyes follow your finger), Bangla voice, Bangla digits, progress, confetti |
| `sw.js`, `manifest.webmanifest` | Offline support and installable app |

## Run it
Offline mode needs a server (not `file://`):
```bash
cd khude-biggani && python3 -m http.server 8000   # open http://localhost:8000
```

## Notes and next steps
- **Voice:** the "🔊 শোনো" button uses the phone's built-in Bangla text-to-speech when available, and is hidden otherwise. Next step: record a real human voice for তুহিন.
- **Next worlds:** robots, coding (Bangla block coding), sky-watching (Bangla star names), electricity and solar power, nature and weather.
- Match lessons to the NCTB school curriculum, Class 3–8.
