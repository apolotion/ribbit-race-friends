import { rmSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Exact obsolete release files only. No saves, custom assets, or server data.
export const obsoleteFiles = [
  "public/styles/rr-170.css",
  "public/styles/extended-features.css",
  "public/styles/game-shell.css",
  "public/styles/base.css",
  "public/styles/cloud-ui.css",
  "public/icons/ribbit-race-512.png",
  "public/icons/ribbit-race-192.png",
  "public/icons/favicon-64.png",
  "public/tutorial/ember-confused.png",
  "public/tutorial/ember-shocked.png",
  "public/tutorial/ember-determined.png",
  "public/tutorial/ember-cool.png",
  "public/tutorial/ember-confident.png",
  "public/tutorial/ember-thumbsup.png",
  "public/tutorial/ember-amazed.png",
  "public/tutorial/ember-happy.png",
  "public/tutorial/ember-questioning.png",
  "public/tutorial/ember-sad.png",
  "public/tutorial/ember-annoyed.png",
  "public/tutorial/ember-smile.png",
  "public/tutorial/ember-dazed.png",
  "public/tutorial/ember-thinking.png",
  "public/tutorial/ember-peace.png",
  "public/tutorial/ember-laughing.png",
  "public/icons/medal-options/frog.png",
  "public/icons/medal-options/check.png",
  "public/icons/medal-options/spiral.png",
  "public/icons/medal-options/lightning.png",
  "public/icons/medal-options/trophy.png",
  "public/icons/medal-options/smile.png",
  "public/icons/medal-options/star.png",
  "public/icons/medal-options/gem.png",
  "public/icons/medal-options/laurel.png",
  "public/icons/medal-options/crown.png",
  "browser_menu_35.py",
  "browser_test35.py",
  "build_standalone35.py",
  "debug_browser35.py",
  "debug_browser35_b.py",
  "make_medals.py",
  "patch_cards_35.py",
  "patch_online_35.py",
  "patch_replay_35.py",
  "patch_stats_35.py",
  "patch_tests_35.py",
  "patch_ui_35.py",
  "OPTIMIZATION_REPORT.md"
];
export function cleanRelease(root=process.cwd()) {
  for(const file of obsoleteFiles)rmSync(resolve(root,file),{force:true});
  // Superseded release notes accumulate when GitHub uploads replace only files.
  for(const name of readdirSync(root))if(/^UPDATE_NOTE_POLISH_\d+\.txt$/.test(name))rmSync(resolve(root,name),{force:true});
  const dir=resolve(root,'public/icons/medal-options');
  if(existsSync(dir)&&!readdirSync(dir).length)rmSync(dir,{recursive:true});
}
