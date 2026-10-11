# Ember Tutorial Dialogue Script

Build: `2026.10.11-friends-tutorial-refinement-1`  
Displayed version: `VERSION 1.7.5`

## Dialogue behavior

Every checked scenario loads its authored Park setup first. Ember’s compact dialogue then appears at the top of the screen, with Ember’s mirrored close-up portrait on the right. Pressing Space or Enter—or tapping and releasing on mobile—closes the dialogue and unlocks normal gameplay. The closing Space press is consumed until the player releases it.

Failed one-attempt exercises reset immediately with a ninja-style smoke poof. The dialogue is not repeated after every failure.

## 1. Welcome to Ribbit Race — Smile

> Hey there! I’m Ember. Welcome to Ribbit Race!  
> I’ll show you the ropes so you can hop, catch,  
> and compete like a pro.

**Goal:** Make one jump.

## 2. Match the Term — Confident

> Your goal is simple: catch flies and be the best!  
> I’ll give you an English term. Catch the fly  
> with the matching Spanish word.

**Goal:** Catch the fly matching the term at the bottom.

## 3. Charge a Full Jump — Cool

> Hold to charge your jump, then release to leap!  
> The longer you hold, the farther you go.  
> Catch this fly with one fully charged jump.

**Goal:** Max-charge and catch the fly in one attempt. Releasing too early resets immediately.

## 4. Automatic Catch Range — Confident

> Flies are caught automatically when you’re close.  
> This one is just beyond your normal jump.  
> Get close enough and your tongue will reach it.

**Goal:** Catch the fly specifically with the frog’s tongue.

## 5. Wrong Flies Are Safe — Laughing

> Grab the wrong fly? No worries!  
> You’ll spit it back out. Catch the wrong fly,  
> then the right fly in the same jump.

**Goal:** Catch the aligned wrong fly first, then the correct fly before landing.

## 6. Turn Around with a Wall — Thinking

> One catch: you can’t turn around in mid-air.  
> Use your first jump to hit the wall, then use  
> your second jump to come back for the fly.

**Goal:** Turn at the wall and catch the fly within two jumps.

## 7. Rebound Catch — Cool

> Now let’s make that wall turn look smooth.  
> You get one jump: hit the wall, rebound,  
> and catch the fly on the way back.

**Goal:** Complete the rebound catch in one jump.

## 8. Quick Platform Drop — Confident

> On a platform, tap jump quickly to drop through.  
> The fly is just ahead and below.  
> One attempt—drop and catch it.

**Goal:** Quick-drop and catch the fly in one attempt. Charging instead resets immediately.

## 9. Buffer a Platform Drop — Thinking

> You can buffer a drop before you land.  
> Charge to the top platform, tap just before  
> touchdown, and fall through to the fly.

**Goal:** Buffer through the top platform and catch the fly below.

## 10. Double Buffer Drop — Cool

> Ready for the fancy version?  
> Buffer through the top, then the middle,  
> and catch all three flies on the way down.

**Goal:** Complete two buffered drops and catch three sequential flies.

## 11. Two Flies in One Arc — Smile

> Line up multiple flies in one jump arc.  
> It’s a great way to go faster!  
> Catch both before you land.

**Goal:** Catch two prompted flies during one jump.

## 12. Final Practice Round — Smile

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

The legitimate pre-tutorial save is restored before the permanent achievement is written.
