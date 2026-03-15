# Hemet Fishing Game

## Current State
New project with no existing features.

## Requested Changes (Diff)

### Add
- Full fishing game set in Hemet, California with Diamond Valley Lake / San Jacinto River scenery
- Canvas-based 2D game with animated water, sky, desert landscape, hills
- Day/night cycle: gradual sky color transitions, different fish availability per time period
- Fish species: Largemouth Bass, Catfish, Rainbow Trout, Common Carp, Bluegill -- each with weight ranges, rarity, and time-of-day preferences
- Fishing mechanic: tap-to-cast (mobile-friendly), line arc animation, bobber on water, tension/reel mechanic when fish bites
- Simple HUD: current time, score, fish caught count, current location label (Diamond Valley Lake)
- Catch popup: fish name, weight, points earned
- Score/leaderboard system stored in backend: player name, total score, fish count
- Leaderboard screen showing top scores
- Local Hemet flavor: location names, valley references in UI text
- Relaxing outdoor aesthetic with warm desert color palette

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store leaderboard entries (playerName, score, fishCount, timestamp)
2. Frontend game canvas: sky/water/landscape rendering with day/night
3. Game loop: cast -> wait -> bite -> reel mechanic
4. Fish data: species, weight range, rarity, time preference
5. HUD overlay: time dial, score, session stats
6. Catch modal: fish reveal animation
7. Leaderboard screen: fetch and display top scores
8. Start screen: player name entry, location lore
