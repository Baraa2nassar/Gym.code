# Gym Log

A phone-friendly gym tracker for a Push / Pull / Legs split. Open it, tap the day, tap an exercise, and log the set.
Every set is saved with the time you logged it, how many reps, and the weight in pounds. Kilograms are shown next to it for reference.

## How it works

- **Barbell lifts** (incline/flat press, rows, squat, deadlift): tap the colored plates to load the bar, the same colors as the Rogue
  bumpers on the rack: red 55, blue 45, yellow 35, green 25, black 10, white 5, gray 2.5. Each tap adds a pair (one per side).
  The bar picture shows what's loaded, and you tap a plate on the bar to take it off. The total is worked out for you
  (bar + 2 × plates per side), so no more "25 means 25×2+45 = 95" notes.
- **Dumbbells**: weight per hand (quick buttons plus ±2.5 / ±5).
- **Machines / cables**: stack weight.
- **Assisted pull-ups / dips**: the assist weight; "None" means bodyweight. Set your bodyweight in Settings to see the effective load.
- Each exercise shows **what you did last session**, and the weight from your last set is pre-filled, so most sets are just tap reps, then tap Log.
- Sets today / target (e.g. `2/3`), a rest timer since your last set, and a 🏆 when a set beats your best estimated 1-rep max.
- **History**: every session by date. Tap × to delete a mistake.
- **Progress**: a chart per exercise for top set, estimated 1RM (Epley), volume, or reps, plus a table of every session.
- **Settings**: add your own exercises, load your past handwritten notes, export/import a backup (JSON) or a CSV.

## Running it

It's a static site with no build step: `index.html`, `style.css`, `app.js`, `seed.js`.

- **On your phone**: turn on GitHub Pages for this repo (Settings → Pages → deploy from branch), open the URL, then use
  "Add to Home Screen". After the first visit it also works offline.
- **Locally**: `python3 -m http.server` in this folder, then open http://localhost:8000.

Data is stored in the browser on that device (localStorage). Use **Export backup** now and then.

## Past notes

`seed.js` holds the sets from the written log, converted to total pounds (barbell totals include the 45 lb bar; squat
"70" = 70 of plates + bar = 115). The notes had no dates, so sessions are placed one week apart, ending the week of
Oct 12, 2026, and are marked "est. date". Unfinished sets like `(25x` were left out.
