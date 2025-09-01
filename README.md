# MR Narrative Space Explorer

Original concept from [Liis Vares & Taavet Jansen](https://vares.digital), developed during the MODINA residency as part of the [Still Moving](https://modina.eu/projects/still-moving/) project.

<p align="center">
    <img src="https://modina.eu/wp-content/uploads/2025/08/IMG_43D24A41DEAA-1-portrait-scaled.png" alt="mobile app screenshot" width="300">
</p>

A Portable mixed reality (MR) environment to explore text and physicality in a digital space. This web app is inspired by the system used in the interactive performance, Still Moving (developed by [Norbert Pape](https://norbertpape.github.io/index.html)), originally implemented in Unity3D with the Meta Quest Headset. This demo intends to offer a lo-fi emulation designed to explore some of the conceptual foundations of the original system.
To begin, enable the camera view in your mobile browser, tap the screen to spawn a new word, drag with two fingers to rotate or resize the last word. Words are selected from the text corpus, which can be edited in the menu. The default text is taken from the Still Moving project description.

**Narrative Space Explorer Demo:** https://launchar.app/go?url=https%3A%2F%2Fmr-narrative-space-explorer.onrender.com

Currently for mobile only, camera permissions are required. Web demos are hosted via render.com, and may initially take ~1 minute to load.

**Alternative Link (Native Browser):** https://mr-narrative-space-explorer.onrender.com

## Running from source

- Clone repository
- `cd mr-narrative-space-explorer/`
- `npm run build`
- `npm run start`
- `npm run start`
- Open a new terminal tab:
  - `cloudflared tunnel --url http://localhost:5005` or
  
  - `ngrok http http://localhost:5005`
- open generated url in your mobile browser