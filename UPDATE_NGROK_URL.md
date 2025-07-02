# 🔄 How to Update ngrok URL in Your Project

Whenever you restart ngrok, your public URL changes (unless you have a paid static domain).
Follow these steps to update your project to use the new URL:

---

## 1. Start ngrok

```sh
ngrok http 3000 --authtoken <YOUR_AUTH_TOKEN>
```
- Copy the new public URL (e.g., `https://xxxx-xx-xx-xxx-xx.ngrok-free.app`).

---

## 2. Update Your Frontend Configuration

**A. If using `.env.local` (recommended for Next.js):**

```env
# frontend/.env.local
NEXT_PUBLIC_SITE_URL=https://xxxx-xx-xx-xxx-xx.ngrok-free.app
NEXT_PUBLIC_API_URL=https://yyyy-yy-yy-yyy-yy.ngrok-free.app  # If backend is also on ngrok
```

**B. If using `frontend/src/config/index.ts`:**

```js
export const config = {
  API_URL: 'https://xxxx-xx-xx-xxx-xx.ngrok-free.app', // Update to new ngrok URL
  // ...other config
};
```

**C. If using `frontend/next.config.js`:**

```js
env: {
  NEXT_PUBLIC_SITE_URL: 'https://xxxx-xx-xx-xxx-xx.ngrok-free.app',
  NEXT_PUBLIC_API_URL: 'https://yyyy-yy-yy-yyy-yy.ngrok-free.app',
},
```

---

## 3. Update QR Code Generation (if hardcoded)

If you generate QR codes with a hardcoded URL, update it to the new ngrok URL.

---

## 4. Restart Your Frontend Server

```sh
cd frontend
npm run dev
```

---

## 5. (If Needed) Update Backend CORS

In `backend/config.js`, add the new frontend ngrok URL to `allowedOrigins`:

```js
const allowedOrigins = [
  'http://localhost:3000',
  'https://xxxx-xx-xx-xxx-xx.ngrok-free.app', // new frontend ngrok URL
];
```
Then restart your backend server.

---

## 6. Test Everything

- Open your new ngrok URL in a browser.
- Test all features (QR code, API calls, PDF download, etc.).

---

## 💡 Tip

- You must repeat this process every time you restart ngrok (on the free plan).
- For a static URL, consider upgrading to a paid ngrok plan. 