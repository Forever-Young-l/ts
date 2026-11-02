# 江天一阁 · 走进《滕王阁序》

A first-person, code-built Three.js poetic journey inspired by Wang Bo's Preface to the Pavilion of Prince Teng. The architecture uses a refined voxel / timber hybrid; river, clouds, mist, birds, boat, lanterns, rain and dusk are animated procedurally.

## Experience

- 80-second automatic first-person camera journey across six poem chapters
- Free-roam mode (W/A/S/D + mouse pointer lock)
- Dynamic rain clearing, moving cloud layers, river shimmer, drifting fishing boat, flying egret and geese, swaying reeds and flickering lanterns
- Original plucked-string ambient score generated in Web Audio
- Chinese voice narration preview using the browser's available zh-CN speech voice; it prefers a male-labelled voice where available
- Optional upload of a complete recorded male narration track (MP3/WAV)
- 1080 × 1920 portrait composition captured from a clean scene canvas
- Browser recording to WebM; import into Jianying / CapCut to export MP4

## Run locally

Run a local static server with Python's http.server on port 8000, then open localhost:8000.

The page loads Three.js 0.160 from jsDelivr, so the browser needs network access for the library.

## Storyboard and narration

The timed six-chapter shot list and narration cues are in docs/shotlist.md.

## Record a film

1. Open the page in desktop Chrome or Edge.
2. Press the record button.
3. In the browser capture picker, select this tab and enable Share tab audio. This captures browser speech synthesis with the original score.
4. The 80-second camera path starts automatically. The video is recorded as a portrait 1080 × 1920 WebM.
5. If you have a professionally recorded male narration track, upload the full voice track before recording. It is mixed with the generated score.
6. Import the WebM into Jianying / CapCut and export H.264 MP4 at 1080 × 1920, 30 fps.

## Narration notes

Browser speech synthesis depends on installed voices and operating system. The app prefers a Chinese voice whose name suggests a male voice, but voice gender and timbre cannot be guaranteed across devices. For a release-quality male performance, upload a licensed or self-recorded full narration track. The poem lines and cue timing are already aligned to the camera timeline.

## Creative and historical note

This is a stylized poetic interpretation, not a measured architectural reconstruction of the present-day Tengwang Pavilion. The scene intentionally avoids modern objects and contemporary signage.
