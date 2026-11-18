# Freesound Audio Candidates

## Integration

- Provider: Freesound API v2
- Endpoint: `GET https://freesound.org/apiv2/search/`
- Authentication: server-only `Authorization: Token <FREESOUND_API_KEY>` header
- Response: JSON sound-list metadata requested with `fields=id,name,username,license,duration,previews,url,tags,loopable`
- Licence policy: CC0 only. Provider licence values are verified and normalized to [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- Media policy: preview metadata only; original files are not downloaded. Preview and source URLs must pass HTTPS host/path validation.

Real verification on 2026-11-18 returned HTTP 200 and at least one validated candidate for every predefined slot. Every candidate below had an HTTPS MP3 or OGG preview. These are discovery results, not final audio selections.

## Music candidates

| Slot | Verified CC0 candidates |
| --- | --- |
| Welcome Page | [477602](https://freesound.org/people/SkibkaMusic/sounds/477602/) — Music Happy 7, SkibkaMusic; [520192](https://freesound.org/people/code_box/sounds/520192/) — Full of Energy, code_box |
| Emerald Jungle | [573973](https://freesound.org/people/code_box/sounds/573973/) — Tropical Cruise, code_box; [548002](https://freesound.org/people/szegvari/sounds/548002/) — Happy Day in Beach Hand Pan, szegvari |
| Sunset Ruins | [686838](https://freesound.org/people/ZHR%C3%98/sounds/686838/) — Desert ambient music, ZHRØ; [469706](https://freesound.org/people/florianreichelt/sounds/469706/) — Drums of Bedouins, florianreichelt; [734130](https://freesound.org/people/xkeril/sounds/734130/) — The desert of our breakup, xkeril |
| Crystal Cavern | [611095](https://freesound.org/people/szegvari/sounds/611095/) — Magic Grass, szegvari; [770064](https://freesound.org/people/Vrymaa/sounds/770064/) — Nemorum, Vrymaa |

The Phase 2B choices remain provisional until final human audition. Search relevance and Freesound's `loopable` descriptor do not prove that a preview loops seamlessly.

## Phase 2C provisional music configuration

| Section | Primary | Approved fallback | Playback note |
| --- | --- | --- | --- |
| Welcome Page | [477602](https://freesound.org/people/SkibkaMusic/sounds/477602/) — Music Happy 7, SkibkaMusic, CC0 1.0, 34.2s | [520192](https://freesound.org/people/code_box/sounds/520192/) — Full of Energy, code_box, CC0 1.0, 34.8s | Cheerful adventure shortlist; not looped |
| Emerald Jungle | [573973](https://freesound.org/people/code_box/sounds/573973/) — Tropical Cruise, code_box, CC0 1.0, 34.8s | [548002](https://freesound.org/people/szegvari/sounds/548002/) — Happy Day in Beach Hand Pan, szegvari, CC0 1.0, 38.9s | Light tropical shortlist; not looped |
| Sunset Ruins | [686838](https://freesound.org/people/ZHR%C3%98/sounds/686838/) — Desert ambient music, ZHRØ, CC0 1.0, 235.9s | [734130](https://freesound.org/people/xkeril/sounds/734130/) — desert music, xkeril, CC0 1.0, 121.0s | Long-form desert ambience; not looped |
| Crystal Cavern | [611095](https://freesound.org/people/szegvari/sounds/611095/) — Magic Grass, szegvari, CC0 1.0, 75.4s | [770064](https://freesound.org/people/Vrymaa/sounds/770064/) — Nemorum, Vrymaa, CC0 1.0, 83.4s | Magical fantasy shortlist; not looped |

The IDs are centralized in `lib/audio/audio-catalog.js`. The browser receives their validated metadata through `/api/audio/catalog`; no preview URL or licence claim is hardcoded into the playback manager. Freesound returned `loopable: false` for every configured candidate, so browser looping is intentionally disabled pending manual seamless-loop approval.

## Gameplay effect candidates

| Slot | Verified CC0 candidates |
| --- | --- |
| Player jump | [350906](https://freesound.org/people/cabled_mess/sounds/350906/) — cabled_mess; [365672](https://freesound.org/people/mikala_oidua/sounds/365672/) — mikala_oidua; [404793](https://freesound.org/people/OwlStorm/sounds/404793/) — OwlStorm |
| Coin collection | [402767](https://freesound.org/people/LilMati/sounds/402767/), [402766](https://freesound.org/people/LilMati/sounds/402766/), [523547](https://freesound.org/people/LilMati/sounds/523547/) — LilMati |
| Gem collection | [879801](https://freesound.org/people/Qvantor/sounds/879801/) — Qvantor; [859301](https://freesound.org/people/CAT-FOX_ALEX/sounds/859301/) — CAT-FOX_ALEX; [876169](https://freesound.org/people/Assetsmith/sounds/876169/) — Assetsmith |
| Fish power-up | [220173](https://freesound.org/people/GameAudio/sounds/220173/) — GameAudio; [843330](https://freesound.org/people/gulfstreamav/sounds/843330/) — gulfstreamav; [647977](https://freesound.org/people/Cloud-10/sounds/647977/) — Cloud-10 |
| Projectile | [459145](https://freesound.org/people/LilMati/sounds/459145/) — Retro, Pew Shot.wav, LilMati, 0.1s; [478215](https://freesound.org/people/0ne_one111yt/sounds/478215/) — pew.ogg, 0ne_one111yt, 0.5s |
| Enemy defeat | [394466](https://freesound.org/people/plasterbrain/sounds/394466/) — plasterbrain; [868641](https://freesound.org/people/moogleoftheages/sounds/868641/) — moogleoftheages; [756357](https://freesound.org/people/IndyArts/sounds/756357/) — IndyArts |
| Player damage | [878323](https://freesound.org/people/Qvantor/sounds/878323/) — Qvantor; [515624](https://freesound.org/people/mrickey13/sounds/515624/), [515623](https://freesound.org/people/mrickey13/sounds/515623/) — mrickey13 |
| Compass Shrine | [635332](https://freesound.org/people/kdemani/sounds/635332/) — kdemani |
| Countdown tick | [515317](https://freesound.org/people/basarunder/sounds/515317/) — Countdown 1.wav, basarunder, 0.7s; [391650](https://freesound.org/people/jeckkech/sounds/391650/) — beep.wav, jeckkech, 0.2s |
| Countdown GO | [368691](https://freesound.org/people/FartBiscuit1700/sounds/368691/) — 8-Bit Arcade Video Game Start Sound Effect, FartBiscuit1700, 1.0s; [758957](https://freesound.org/people/KSAplay/sounds/758957/) — 8-bit start-game, KSAplay, 0.2s |
| Game Over | [404743](https://freesound.org/people/OwlStorm/sounds/404743/) — Retro video game sfx - Fail, OwlStorm, 0.4s; [848654](https://freesound.org/people/JulyPink/sounds/848654/) — Retro Game Fail Motif, JulyPink, 1.6s |
| Fish revival | [615099](https://freesound.org/people/MLaudio/sounds/615099/), [615100](https://freesound.org/people/MLaudio/sounds/615100/) — MLaudio; [715067](https://freesound.org/people/SkySpeira/sounds/715067/) — SkySpeira |
| World completion | [376009](https://freesound.org/people/deleteCookies/sounds/376009/) — deleteCookies; [258142](https://freesound.org/people/Tuudurt/sounds/258142/) — Tuudurt; [528958](https://freesound.org/people/Beetlemuse/sounds/528958/) — Beetlemuse |
| Final treasure | [456965](https://freesound.org/people/FunWithSound/sounds/456965/) — FunWithSound |

## Remaining decisions

- Audition previews for tone, noise, clipping, and fit with each scene.
- Verify seamless looping manually for the four music slots.
- Manually audition the provisional music and effect choices for subjective tone and loudness.
- Phase 2D intentionally lowers projectile gain and gives tick/GO separate slots; metadata suitability is verified, but tone still needs human audition.
- Gameplay effects are connected through existing GameBridge events; `player:jumped` is the only new event and represents a successful jump rather than raw input.

The network-dependent verifier lives at `tests/integration/verify-freesound.mjs`, outside Vitest's ordinary `.test.js` suite. Run `npm run verify:freesound` to repeat the bounded real-API check, or append slot IDs such as `welcome coin` to verify only selected slots. The command never prints credentials, while `npm test` remains deterministic and requires neither an API key nor internet access.
