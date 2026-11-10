# Audio sources

TreasureHunt Phase 9 uses no third-party audio files.

All music and sound effects are original procedural Web Audio compositions implemented in `lib/audio/audio-service.js` for this project:

- Welcome: magical major-pentatonic melody, warm chord pads and bass at 82 BPM.
- Emerald Jungle: lively syncopated triangle lead, bright harmony and bass at 112 BPM.
- Sunset Ruins: ancient modal melody with restrained reed-like saw lead at 96 BPM.
- Crystal Cavern: slow suspended harmony with bell-like sine echoes at 72 BPM.
- Coin, gem and fish-power effects: short bright original oscillator envelopes.
- Game Over: layered descending melody and low dramatic resolution.

The output stage uses separate music/effect buses, a user-controlled master gain and a gentle dynamics compressor. The compressor prevents stacked harmony and effects from clipping while retaining an audible, comfortable default volume of 70%.

Because the sound is generated at runtime from project-owned note and envelope data, there are no external audio licenses, attribution requirements, downloads, or copied recordings. The implementation may be used under the same terms as the TreasureHunt source code.
