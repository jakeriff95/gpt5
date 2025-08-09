# gpt5

Testing out new GPT 5 Codex

## Driving Game Prototype

Open `index.html` in a browser to play.

### Controls

- ←/→ or `A`/`D` – steer left and right
- ↑ or `W` – increase speed
- ↓ or `S` – slow down

### Gameplay

Click **Start** to begin. Dodge traffic cones, rocks, and other cars while collecting power-ups. Your distance travelled appears in the top-left corner. When you crash, a **Game Over** screen lets you restart without refreshing the page.

A quiet looping chiptune plays in the background while a short tone sounds on impact. Use the **Settings** menu to adjust music volume.

### Implementation Notes

- Road, lane lines, and roadside grass provide a simple pseudo-3D environment. Road edges and dashed center lines now align correctly.
- The game loop resets state instead of reloading the page when the car crashes.
- Power-ups grant temporary speed boosts or a single-use shield.

### Next Steps

Typical game development flows from prototype to production. Future improvements might include multiple levels, expanded obstacle and power-up variety, menus, and polish on art and audio.
