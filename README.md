# Fine Bearing Review Tracker

Fine Bearing Review Tracker is a complete, mobile-friendly web application built for **Fine Bearing & Oil Seal Store**. It tracks customer scans, Google Review button clicks, and self-confirmed review submissions, attributing performance directly to specific sales counters and staff members.

The application is built with **Next.js (App Router)**, **Tailwind CSS v4**, and **Firebase (Firestore)**. It includes a dual-portal login (Admin & Employee), a printable signage card generator, and interactive analytics reporting with spreadsheet downloads.

---

## ⚡ Instant Out-of-the-Box Demo Support

This application features a **hybrid database model** in `src/lib/db.ts`. 
If Firebase environment variables are not configured in `.env.local`, the application **automatically falls back to a simulated LocalStorage database** populated with the 5 dummy employees, 5 counters, monthly targets, and pre-seeded activity logs.

This allows you to open, run, test, and preview the full dashboard and customer flow **instantly** without setting up a database first.

---

## 📁 Project Structure

```
qrs/
├── public/                  # Static assets & favicon
├── src/
│   ├── app/                 # Next.js App Router Page Layouts
│   │   ├── admin/
│   │   │   ├── counters/    # Counter Management & Printable Signage Cards
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/   # Admin Command Center Analytics & Timeline Graphs
│   │   │   │   └── page.tsx
│   │   │   ├── employees/   # Staff Profiles & Monthly targets setup
│   │   │   │   └── page.tsx
│   │   │   ├── reports/     # Detailed Daily/Weekly Reports & CSV downloads
│   │   │   │   └── page.tsx
│   │   │   ├── settings/    # Global configuration for Google Review URL
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx   # Responsive Admin layout with side navigation
│   │   ├── employee/
│   │   │   └── dashboard/   # Employee Personal stand & targets tracking
│   │   │       └── page.tsx
│   │   ├── login/           # Dual Admin/Employee staff credential portals
│   │   │   └── page.tsx
│   │   ├── review/          # Customer Landing Page (confetti submissions)
│   │   │   └── page.tsx
│   │   ├── globals.css      # Tailwind v4 configuration & Brand Theme colors
│   │   └── layout.tsx       # Root layout, fonts, and meta SEO options
│   └── lib/                 # Core utilities
│       ├── db.ts            # Firestore queries & local storage DB simulation fallback
│       └── firebaseClient.ts# Firebase client configuration and connection check
├── .env.example             # Example environment file
├── README.md                # System documentation
├── schema.sql               # Reference SQL schema definition
└── tsconfig.json            # TypeScript configuration options
```

---

## 🗄️ Database Collections (Firebase Firestore)

When Firebase is connected, the app uses the following collections in Firestore:

1. **`settings`**: Manages global configuration keys like `GOOGLE_REVIEW_URL`.
2. **`admin_users`**: Stores credentials for administrators (Default: `admin@finebearing.com` / `admin123`).
3. **`employees`**: Stores sales agent profiles and PIN/Passcodes (e.g. `1001`, `1002`).
4. **`counters`**: Stores counters (e.g. `counter-1`, `counter-2`) and links them to employees.
5. **`monthly_targets`**: Set monthly target numbers of reviews per employee/counter.
6. **`qr_sessions`**: Tracks timestamped QR scans from customer devices.
7. **`review_clicks`**: Tracks clicks on the "Write a Google Review" button.
8. **`review_confirmations`**: Stores customer self-confirmed submissions with optional name fields.

---

## 🏆 Scoring & Leaderboard Rules

To incentivize performance, the system calculates scores using a fair-weight formula:
- **QR Scan** = `1 point`
- **Google Review Button Click** = `2 points`
- **Customer Confirmed Submission** = `5 points`

---

## 🚀 Setup & Local Launch Instructions

### 1. Clone & Install Dependencies
First, open your terminal inside the project folder (`qrs`) and install the node dependencies:
```bash
npm install
```

### 2. Run the Local Development Server
Launch the local server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

---

## ☁️ Connecting to Firebase Firestore

To transition from the offline simulation to your live Firebase database:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Under **Build**, select **Firestore Database** and click **Create database**. Start it in **Production Mode** or **Test Mode**.
3. Under project settings, register a web application to get your Firebase Web SDK config credentials.
4. Create a `.env.local` file in your project root folder by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
5. Update `.env.local` with your Firebase Web SDK credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```
6. Restart your Next.js development server. The application will automatically detect these credentials, initialize the Firestore connection, and **automatically seed the default database tables and credentials** on the first page load!

---

## 📦 How to Deploy/Publish to Production

This is a Next.js application, which can be deployed to any major hosting provider.

### Option A: Deploying to Vercel (Recommended & Easiest)
1. Commit your codebase to a GitHub, GitLab, or Bitbucket repository.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your repository.
4. Under **Environment Variables**, paste the Firestore credentials from your `.env.local` file.
5. Click **Deploy**. Vercel will automatically build the Next.js app and assign a production URL.

### Option B: Deploying to Firebase Hosting
1. Install the Firebase CLI tool globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and initialize hosting in your project directory:
   ```bash
   firebase login
   firebase init hosting
   ```
3. Set the public directory to `.next` (or let the Firebase CLI detect the Next.js application and configure it automatically).
4. Build the application:
   ```bash
   npm run build
   ```
5. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

---

## 🔑 Default Credentials for Mocking/Testing

If testing the default seeded data (offline or after automatic Firestore seeding):

- **Admin Login**:
  - Email: `admin@finebearing.com`
  - Password: `admin123`
- **Employee PINs**:
  - Amit Sharma (Counter-1): `1001`
  - Priya Patel (Counter-2): `1002`
  - Rahul Verma (Counter-3): `1003`
  - Vikram Singh (Counter-4): `1004`
  - Neha Gupta (Counter-5): `1005`
