# McGift

Family group gift organiser with Up Bank payment tracking.

---

## Setup (10 minutes)

You need a **Vercel** account (free) and your **Up Bank** token.

### 1. Get your Up Bank token

Go to [api.up.com.au/getting_started](https://api.up.com.au/getting_started), log in, and copy your Personal Access Token. It looks like `up:yeah:xxxxxxxxxx`.

### 2. Push to GitHub

Create a new repo on GitHub and upload this folder. You can either:

- Drag and drop the files into GitHub's web interface, or
- Use git:

```bash
cd mcgift
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/mcgift.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **Add New → Project**
3. Import your `mcgift` repo
4. Before clicking Deploy, add this **Environment Variable**:

   | Name | Value |
   |------|-------|
   | `UP_BANK_TOKEN` | Your Up Bank token from step 1 |

5. Click **Deploy**

### 4. Add KV Storage

After the first deploy:

1. In your Vercel project, go to the **Storage** tab
2. Click **Create** → **KV** (Redis)
3. Name it anything (e.g. "mcgift-data")
4. Click **Create**
5. Vercel auto-connects it — the environment variables are set for you
6. Go to **Deployments** and click **Redeploy** on the latest deployment

### 5. Done

Your app is live at `your-project.vercel.app`. Share the URL with your family.

---

## How it works

- **Gifts tab** — create group gifts, assign contributions, track payments
- **Wish Lists tab** — anyone can add what they'd like (just a name and free text)
- **People tab** — your family members
- **Sync button** — checks your Up Bank for payments matching each gift's reference code (e.g. `MG-XK3M9`)
- **Archive** — close off completed gifts

Your Up Bank token stays server-side — it never reaches the browser.

---

## Costs

$0 on Vercel's free tier. The KV storage free tier gives you 3,000 requests/day and 256MB storage — a family app won't come close to hitting either.

---

## Making changes

Edit code → push to GitHub → Vercel auto-redeploys in ~30 seconds.
