# Ember Tutorial Dialogue Script — Version 1.7.10

The tutorial begins only after a player signs in, creates an account, or chooses **Play Without Saving**. Ember speaks one line at a time from the real Park game.

Dialogue uses the approved compact dark-blue box with larger left-aligned text. Wrapped lines return to the same left edge. Hold **Space** to type at 2× speed; tap **Space** or **Enter**—or tap and release on mobile—to reveal or advance. The two-frame down triangle changes every 520 ms and appears only when another line remains. The Space press that closes a scene's final line is consumed so it cannot also begin the exercise.

## Scene 1 — Welcome

1. Hey there, tadpole! Welcome to Ribbit Race!
2. I'm Ember - a Ribbit Race pro from this side of the pond.
3. I'll show you the ropes so you can hop, catch, and compete with the best.
4. Who knows? Maybe you'll even keep up with me someday!
5. Your goal is simple...
6. Catch the most flies and be the best!

**Exercise:** None. The tutorial advances automatically.

## Scene 2 — Three Long Jumps

1. Let's put those frog legs to work!
2. Hold the jump button to charge, then release to leap.
3. The more you charge, the farther you'll go - but timing is everything!
4. Hold too long, and you'll lose some of that distance.
5. Try releasing just as your charge gets close to full.
6. Show me three long jumps in a row!

**Exercise:** Perform three consecutive jumps at 90% charge or higher. Each proper landing plays the normal catch sparkle and success sound. Closing the final line does not poof or move the frog; a separate Space press begins the first jump from the normal Park starting position.

## Scene 3 — Three Matching Catches

1. Not bad, tadpole! You've got some spring in those legs.
2. Looks like dinner is ready!
3. Every fly has a term above its head.
4. Your English clue appears at the bottom of the screen.
5. Catch the fly with the matching translation to score a point.
6. Let's get three points - one matching fly per jump!

**Timing:** The frog and first fly poof into place together. The previous sentence remains visible while the fly appears and for another 500 ms; line 2 then begins typing without an empty-box flash. The fly term and English clue flash during lines 3 and 4.

**Exercise:** Complete three authored matching catches. Immediately after each correct catch, the English term becomes blank. After landing, the frog holds for 500 ms, then the next frog-and-fly setup poofs in and reveals the new term. A miss retries only the missed catch.

## Scene 4 — Tongue Range

1. Enjoy your meal? Don't forget to leave a tip!
2. Speaking of tips... here's a good one!
3. You don't have to land right on a fly to catch it.
4. Get close enough, and your tongue will grab it automatically.
5. This fly is too far for even my legs.
6. Charge a long jump and let your tongue handle the rest!

**Timing:** Before line 5, the frog and fly poof into position together. The frog stands in the exact center of Park's lower-left platform. The target is high in the gap between the top platform and the top of the screen.

**Exercise:** Catch the target with the tongue. The success uses the stock Single Player final-catch slow motion, camera zoom, impact overlay, and sound path.

## Scene 5 — Wrong Fly, Updated Clue, and Return

1. Now you're catching in style!
2. But dinner won't always be served one fly at a time.
3. There can be up to four flies on the screen at once, so check your clue!
4. Catch the wrong fly, and you'll spit it right back out.
5. That wrong fly does not count, but it stays on the field.
6. You can leave it behind and come back to it later.
7. Catch the right fly, and your English clue will update.
8. That can turn the fly you skipped into the new correct match!
9. This time, catch a fly that doesn't match.

**Initial setup:** After line 9 closes, the frog and the first nonmatching fly poof into place together.

**Exercise:**

1. Touch the nonmatching fly. It spits back out, scores no point, and remains on the field.
2. After the frog lands, the frog and a new matching fly poof into the follow-up setup while the skipped fly remains.
3. Catch the new matching fly. The English clue changes to the original fly's term.
4. Return for the original fly, which is now the correct match. The scene completes only after that return catch and landing.

## Scene 6A — One Match and One Spit-Out

1. I don't know about you, but all this jumping sure does work up my appetite.
2. So why stop at one fly per jump?
3. Line up your leap, and you can catch several before you land!
4. Not every fly along the way will be a match, though.
5. Try catching both of these flies in one jump.

**Timing:** After line 2, the frog and both flies poof into place together. They do not appear at scene start.

**Exercise:** Catch the matching fly first. The clue then changes to a term that does not match the remaining higher fly, forcing one normal spit-out in the same jump.

## Scene 6B — Two Matching Flies

1. One match and one spit-out!
2. Let's try turning both catches into points.
3. Watch your English clue as you go.
4. This time, catch two matching flies in a single jump!

**Exercise:** The previous route is mirrored. The frog and both flies enter together from the opposite-side setup, and both matching flies must be caught before landing.

## Scene 6C — Three Matching Flies

1. Two for two! Okay, that was pretty good.
2. But how about a bigger helping?
3. Line up your jump and catch all three matching flies before you land!

**Exercise:** The frog and all three flies remain hidden until their shared poof-in. Start from the left middle platform and follow the supplied diagram route over the top center and through the two right-side targets. Catch all three before landing.

## Scene 7 — Wall Turn

1. Three flies in one jump?! Okay, now you're showing off!
2. There's just one catch to this all-you-can-eat buffet...
3. The only way to turn around is by hitting a wall.
4. Miss a fly, and you'll need to bounce off a wall to head back for it.
5. Let's practice! Use your first jump to hit the wall and turn around.
6. Then jump back and catch the fly you passed.

**Timing:** The frog and target fly poof in together when line 6 begins. The fly is not present during the earlier lines.

**Exercise:** Touch the wall and return for the fly above the middle platform within two actual jumps. Quick or buffered drops do not count. Completion waits for landing.

## Scene 8 — One-Jump Rebound

1. Nice turnaround! Now let's turn those two jumps into one.
2. You don't have to land before making your comeback!
3. Jump into the wall, bounce back, and catch the fly before you touch the ground.
4. Make it all happen in one jump!

**Exercise:** The frog and target enter with the scene poof. Complete a one-jump wall rebound catch. Physics continues until landing before the scene freezes and advances.

## Scene 9 — Quick Platform Drop

1. You're a natural, tadpole!
2. Now, what happens when dinner is downstairs?
3. While you're standing on a platform, give the jump button a quick tap - press and release.
4. Instead of charging a jump, you'll drop straight through!
5. Give it a try and catch the fly underneath you.

**Exercise:** The frog and target enter together. Quick-drop through a Park platform and catch the fly. The drop does not increment the jump counter.

## Scene 10 — Buffered Platform Drop

1. What if you want to eat as soon as possible?
2. Press jump just before you land on the platform.
3. Time it right, and you'll drop straight through while keeping your momentum!
4. This is called buffering - getting your next move ready before you land.
5. Let's use a buffered drop to catch this fly!

**Exercise:** The frog and target enter together. Buffer through the authored platform and catch the fly. The drop itself does not count as another jump.

## Scene 11 — Double Buffer Drop

1. Looking smooth!
2. You can chain those drops together, too.
3. Press jump just before each landing to drop through one platform, then the next.
4. Keep that rhythm going and catch all three flies!

**Exercise:** The frog and all three targets enter with the shared scene poof. Complete two distinct buffered drops and catch all three flies without inflating the jump counter.

## Scene 12 — Final Round

1. You're moving so fast, I thought you were a dart frog for a second!
2. You've got the basics. Now let's put them all together.
3. Catch five matching flies to complete a normal round.
4. Pick your matches, time your jumps, and make those walls and platforms work for you!
5. I'll be cheering you on from the lily pads!

**Exercise:** Complete a normal five-fly mirrored Park round. The footer shows normal TIME/JUMPS/BEST metrics instead of a tutorial goal card. The standard Single Player victory flow runs, and only then is **RIBBIT READY** awarded.
