# Somion HQ — running the demo

Ten minutes, nine beats. The script is the contract: every beat has a prepared
event behind a hotkey, so nothing in the demo depends on luck.

---

## Before you present

Run these once, on the machine you will actually present from, in the browser
you will actually use. Do not skip the permission step — a permission dialog
appearing in front of the founder is the one interruption this script cannot
absorb.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

1. Open **http://localhost:3000/hq/office**.
2. Click anywhere once. This arms the audio context — browsers refuse to start
   one before a gesture, so the first knock would otherwise be silent.
3. Open **/hq/meetings/mt-1/call** and press the camera button. **Allow** the
   camera. Press the share button and **allow** screen capture, then stop it.
   Both permissions are now remembered for the session.
4. Press `0` to reset the workspace to its opening state.
5. Have the backup video open in a second tab.

If the camera or screen share is refused at demo time, nothing breaks: the call
falls back to audio-first tiles, which is the product's actual default. Say so
and move on.

---

## Hotkeys

Press these with focus anywhere except a text field. They never fire while you
are typing a message.

| Key | What happens |
|-----|--------------|
| `Shift+S` | Sara walks across the floor toward you, speaking. Her voice gets louder and pans as she approaches. |
| `Shift+K` | Omar accepts the knock you sent him, and the huddle opens. |
| `Shift+R` | A reply lands in the open thread. |
| `Shift+G` | The client guest arrives in the meeting lobby. |
| `Shift+F` | Time runs at 60x for ten seconds, ending a Focus block and producing the summary. |
- `Shift+E` empties the office (everyone else signs off) and fills it again: the first-day floor.
- `Shift+P` has Lena share her screen in the client call, for the view from the audience.
| `0` | Full reset to the opening state. Press this before every run. |

`/` focuses search from anywhere.

## First run

`/hq/setup` is the five-step wizard an admin sees the first time the module is
switched on: name, floor, rooms, people, defaults. Every step has a working
default and the whole thing can be skipped. Worth showing only if someone asks
how the workspace gets created - the demo itself starts from a set-up floor.

## Walking the floor

Arrow keys or `W` `A` `S` `D` walk you across the office. Shift with an arrow
key covers ground faster (Shift with a letter is a presenter hotkey). Crossing into a room enters it and connects its audio; crossing
back out releases it. The keys never fire while you are typing a message.

This matters in beat 2: **walk toward Sara rather than clicking**, and the
proximity audio rises continuously as you close the distance, which is far more
convincing than a jump cut.

---

## The script

### 1 · Morning arrival — 60s
Open the Business OS. Land on HQ, on the **Office**.

> "This is the seventh module. Same shell as the other six — same top bar, same
> app switcher. The difference is what it shows you: not a list of unread
> things, but who is actually around."

Point out, without clicking: five people at the desks, two talking in Room B,
Omar in Focus in the Quiet Room, Priya away in the kitchen. Note that offline
people are not on the floor at all — they are not in the office.

Walk yourself into the desk area with the arrow keys. Note the desk area says
**"Open floor. Audio connects in rooms, not here."**, and that each room is
furnished for what it is for: desks and a water cooler in the open plan, a
table under a wall screen in Room A, shelves in the Library. The strip above
the floor lists everyone by room; hover Room B to see who is in it.

> "Presence is free. Audio only connects when you actually enter a room. That
> single rule is the difference between one or two dollars per user per month
> and five to ten."

### 2 · Proximity — 45s
Press **`Shift+S`**, then walk toward her with the arrow keys.

Sara crosses the floor. Her voice rises and pans as she gets closer, and the
little meter above her tile moves with it. As she comes into earshot a soft
bubble forms around the two of you: that is the audio graph, made visible.

Click her tile: the slider is her volume for you, "Mute for me" is yours, and
"Mute mic" and "Deafen" are a moderator's and say so.

> "That is a real Web Audio panner on a real spatial graph. When the media
> provider is wired up, the same graph drives their audio tracks instead of a
> sample. Nothing above this line changes."

### 3 · Knock — 60s
Click **Omar** (violet ring, in Focus).

The menu says his knocks are held. Click **Knock**, type *"quick one about the
export job"*, send.

Press **`Shift+K`**.

He accepts, the huddle opens, the dock appears with a timer. Leave.

> "From seeing him to talking to him: one action. No link, no invite, no meeting
> ID. And because he was in Focus, the knock waited rather than interrupting."

### 4 · Discuss from a task — 90s
Open **Task Manager** from the app switcher (top-left rail).

The task is *Renew Baumgartner AG retainer*. Note the **presence dot on Lena** —
the same dot as on the floor, in a different module.

Click **Discuss**. A thread opens with a live card for the task: status, owner,
due date. Type something. Press **`Shift+R`** — a reply arrives.

Go back to the task. It now lists the conversation under **Conversations**.

> "This is the part no competitor can copy. Kumospace and Gather sell you a
> room. Slack sells you a channel. We can sell you the conversation already
> attached to the invoice it is about — because we own the invoice."

Press Discuss again to show it re-opens **the same thread**, not a new one.

### 5 · Client meeting — 120s
**Meetings → Baumgartner AG - invoice review.**

Show the guest link and the client's own branding. Click **Join meeting**.

Press **`Shift+G`**. Anna appears in the lobby. Click **Admit**.

Turn on your camera — that is your real camera. Share your screen — that is
your real screen. Open the **whiteboard** — that is real Excalidraw, the same
component recommended for production.

Open **/guest/mt-1** in a second tab to show what Anna sees: the customer's
name, no suite navigation, no third-party product anywhere. Asking to join from
that tab reaches the lobby in the first one: type **Anna Baumgartner** to
arrive as the invited guest; any other name arrives as someone who came by the
link, under the name they typed.

> "The guest never learns what software you use. That matters more to a Swiss
> accountant than any feature on this list."

Before leaving, press **Record**. The consent dialog names everyone in the call
and says where the file goes. Start it, then **Leave**.

The meeting page now shows what the call left behind: who actually came against
who was invited, how long it ran, the recording moving from *Processing* to
*Ready* as a File Manager file, and the conversation from the call still there.

> "The chat did not evaporate when the call ended. It is an ordinary channel, so
> it is searchable next month alongside everything else."

**If there is time: Meet now.** On **Meetings**, press **Meet now** and join.
You are alone in the call, so the meeting link is already open. Copy it, open
it in a second tab, type a name and ask to join. Back in the first tab the
guest is waiting in the lobby; admit them and the guest's tab says they are in.
From a conversation's header the same button invites everyone in it and leaves
a Join card in the transcript, so colleagues never need the link.

### 6 · Focus and catch up — 45s
Set your status to **Focus, 25 minutes**. Press **`Shift+F`**.

Time runs forward and the Focus summary appears: knocks held, mentions waiting,
a thread that moved. Click **Catch up**.

> "Nothing interrupted you, and nothing was lost. That is the whole promise of
> quiet-by-default in one screen."

### 7 · The manager's week — 60s
**Insights.**

Read the line above the charts out loud:

> "Everything here describes the team as a whole. There is no view of an
> individual person, for anyone, including admins."

Show the heatmap, the meeting load, room use. Click **What do we collect?**

> "Swiss employment law restricts systems whose purpose is monitoring staff
> behaviour. We are not adding controls to this later. There is no per-person
> data path into that screen at all."

Two things worth a sentence on the way: **Schedule** asks for length, room,
people and a line on why, and the room then wears the meeting on the floor;
in the call, **Speaker view** and the host's **Mute everyone** are in the
dock and the People panel.

### 8 · Mobile — 60s
Open the same workspace on a phone (installed as a PWA, or at 390px width).

Chat thread → join a room's audio from the Office list → status on **Me**.

Chat opens on the list of conversations. Open one, open its details, then use
the phone's Back: it closes the details, then returns to the list. Back never
drops you out of the app with a dialog still open.

> "The floor plan is desktop-only, on purpose. Everything the floor does also
> works as a list, which is what stops this becoming the map nobody opens after
> week three — the failure that closed most of this category."

### 9 · Admin — 30s
**Settings.** Switch the floor template, show the guest policy and retention.

Two more, quickly. **Appearance**: pick Olive - the whole product follows,
and nothing about presence changed colour, because presence owns those hues.
**Policies**: point at **Sign out after inactivity**. Unattended screens end
their session; the last minute warns; the measurement never leaves the
device. Press **Watch the computer** and allow it: from now on working in
any other window counts as being here, and the browser only ever answers
"idle or not".

Point at **People and roles**:

> "HQ keeps no list of people. It reads the Business OS directory. One place to
> add someone, and it applies to all seven modules."

End on the Office.

---

## Rules while presenting

- **No real WebRTC.** If someone asks to place a real call, the answer is: that
  is the developer's two-week spike in weeks 3-4, deliberately not this demo.
- The **"Prototype — mock data"** badge stays in the top bar the whole time.
- Everything in `mock/` is thrown away. What survives is listed in
  `HANDOFF.md`.
- If a beat fails, press `0` and carry on. Do not debug in front of the room.

## Rehearse

Three full runs before the real one. Record the third as the backup video and
keep it open in a tab.
