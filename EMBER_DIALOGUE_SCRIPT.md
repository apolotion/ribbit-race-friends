# Ember Tutorial Dialogue Script

Build: `2026.10.11-friends-ember-dialogue-1`  
Displayed version: `VERSION 1.7.4`

## Dialogue flow

Each checked tutorial scenario follows the same rhythm:

1. The real Park level is already loaded and placed for the next exercise.
2. The game simulation and normal gameplay input are temporarily locked.
3. Ember speaks from the **right side** of a dark teal dialogue panel using one of five close-up portraits.
4. The player presses **Space** or **Enter**—or taps and releases on mobile—to close the dialogue.
5. Space remains blocked until the key is physically released, preventing the same press from accidentally starting a jump.
6. The player performs the scenario with the normal Ribbit Race engine.
7. A successful check advances to the next scenario and opens Ember’s next dialogue. A failed one-attempt scenario resets the authored setup without replaying the entire speech.

## Ember’s visual identity

Ember is the black-and-cream frog with orange accents. In the close-up portraits, Ember keeps:

- black skin with warm orange markings;
- orange patterned Hawaiian shirt;
- black sunglasses;
- gold chain;
- expressive hand poses matching the lesson’s tone.

The included expressions are:

- `ember-confident.png`
- `ember-smile.png`
- `ember-cool.png`
- `ember-laughing.png`
- `ember-thinking.png`

All five are stored under `public/tutorial/`.

## Single Player tutorial dialogue

### 1. Welcome to Ribbit Race — Smile

> Hey there! I’m Ember. Welcome to Ribbit Race!  
> I’ll show you the ropes so you can hop, catch,  
> and compete like a pro.

**Goal after the dialogue:** Make one jump.

### 2. Match the Term — Confident

> Your goal is simple: catch flies and be the best!  
> I’ll give you an English term. Catch the fly  
> with the matching Spanish word.

**Goal:** Catch the fly matching the term at the bottom.

### 3. Charge a Full Jump — Cool

> Hold to charge your jump, then release to leap!  
> The longer you hold, the farther you go.  
> Catch this fly with one fully charged jump.

**Goal:** Max-charge and catch the authored fly in one attempt.

### 4. Automatic Catch Range — Confident

> Flies are caught automatically when you’re close.  
> Your tongue can reach a little farther too—  
> you don’t have to land directly on the fly.

**Goal:** Enter normal body or tongue range and catch the fly.

### 5. Wrong Flies Are Safe — Laughing

> Grab the wrong fly? No worries!  
> Your frog will spit it back out.  
> Try the wrong one on purpose this time.

**Goal:** Catch the incorrect fly and observe the spit-back.

### 6. Turn Around with a Wall — Thinking

> One catch: you can’t turn around in mid-air.  
> Hit a wall to flip direction, then come back  
> for the fly you passed.

**Goal:** Pass the fly, touch the wall, turn around, and catch it.

### 7. Rebound Catch — Cool

> Now let’s make that wall turn look smooth.  
> You get one jump: hit the wall, rebound,  
> and catch the fly on the way back.

**Goal:** Complete the rebound catch in one jump attempt.

### 8. Quick Platform Drop — Confident

> On a platform, tap jump quickly to drop through.  
> The fly is just ahead and below.  
> One attempt—drop and catch it.

**Goal:** Drop through and catch the fly before the attempt resets.

### 9. Buffer a Platform Drop — Thinking

> You can buffer a drop before you land.  
> Charge to the top platform, tap just before  
> touchdown, and fall through to the fly.

**Goal:** Charge upward, buffer through the top platform, and catch the fly below.

### 10. Double Buffer Drop — Cool

> Ready for the fancy version?  
> Buffer through the top, then the middle,  
> and catch all three flies on the way down.

**Goal:** Complete two buffered drops and catch three sequential flies.

### 11. Two Flies in One Arc — Smile

> Line up multiple flies in one jump arc.  
> It’s a great way to go faster!  
> Catch both before you land.

**Goal:** Catch two prompted flies during one jump.

### 12. Final Practice Round — Smile

> That’s the basics! Now put it all together.  
> Catch five flies in a normal Park round.  
> I’ll be cheering from the sidelines!

**Goal:** Complete a normal five-fly Park round.

## Completion

The final round opens the tutorial congratulations screen and awards:

```text
RIBBIT READY
Complete the Park Tutorial
```

The legitimate pre-tutorial save is restored before the permanent completion achievement is written.
