# Connect Gym Log to a Google Sheet

Takes about 5 minutes, and it's easiest on a computer. When it's done, every set you log is saved as a row in a Google
Sheet in your own Drive. The app loads from that Sheet when it opens, so your log survives a cleared browser or a new phone.

## 1. Make the Sheet
1. Go to https://sheets.new and name the spreadsheet **Gym Log**.
2. In the menu, click **Extensions → Apps Script**. A code editor opens in a new tab.

## 2. Paste the script
1. Delete everything in the editor.
2. Open [`Code.gs`](https://raw.githubusercontent.com/Baraa2nassar/Gym.code/HEAD/google-sheet/Code.gs), select all, copy,
   and paste it into the editor.
3. Click the 💾 **Save** icon.

## 3. Run setup once (creates the tab and your secret key)
1. In the toolbar, make sure the function dropdown says **setup**, then click **▶ Run**.
2. Google asks for permission: **Review permissions** → pick your account → "Google hasn't verified this app" →
   **Advanced** → **Go to Gym Log (unsafe)** → **Allow**.
   That warning appears because this is your own script, not one from the Google store. It only touches this spreadsheet.
3. The **Execution log** at the bottom shows `Your secret key (paste it into the app): …`. Copy that key.

## 4. Publish it as a web app
1. Click **Deploy → New deployment**.
2. Click the ⚙ gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**, then click **Deploy**.
4. Copy the **Web app URL**. It ends in `/exec`.

## 5. Connect the app
On your phone, open the app → **Settings → Google Sheet**. Paste the URL and the key, then tap **Connect**.
The badge at the top turns green and says **Saved to Sheet**. Any sets already on the phone are uploaded.

On another phone, or after clearing your browser, enter the same URL and key and everything loads back.

## Good to know
- **Who can write to it?** "Anyone" means anyone can reach the URL, but every request must include your secret key.
  Without it the script answers "wrong key" and doesn't read or write anything. Don't share the key or put it in this repo.
- **Lost the key?** In Apps Script, open **Project Settings** (⚙ on the left) → **Script properties** → `KEY`.
- **Editing in the Sheet is fine.** Fix a typo in reps or weight, or delete a row, and the app picks it up the next time
  it opens. To add a row by hand, fill in at least `when`, `exercise_id` (for example `squat`), `weight_lb` and `reps`.
- **Offline at the gym?** Sets wait on the phone. The badge shows "Offline · 2 waiting" and they upload automatically
  when you're back online.
- **Updating the script later:** paste the new code, then **Deploy → Manage deployments → ✏ Edit → Version: New version →
  Deploy**. The URL stays the same.
