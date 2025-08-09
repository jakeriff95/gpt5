# gpt5

Testing out new GPT 5 Codex

## Driving Game Prototype

Open `index.html` in a browser to play.

### Controls

- ←/→ or `A`/`D` – steer left and right
- ↑ or `W` – increase speed
- ↓ or `S` – slow down

### Gameplay

Click **Start** to begin. Dodge the black obstacles on the road as long as you can. Your distance travelled appears in the top-left corner. When you crash, a **Game Over** screen lets you restart without refreshing the page.

Engine noise plays while driving and a short tone sounds on impact.

### Implementation Notes

- Road, lane lines, and roadside grass provide a simple pseudo-3D environment.
- The game loop resets state instead of reloading the page when the car crashes.

### Next Steps

Typical game development flows from prototype to production. Future improvements might include multiple levels, different obstacle types, menus, and polish on art and audio.
