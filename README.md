# ReviewSmart Platform - Best Basic Home Toolkit Review Website

An interactive, pixel-perfect affiliate/review landing page cloning the layout, aesthetics, and editorial typography of The ReviewSmart Company' **ReviewSmart**.

This project features the "Best Basic Home Toolkit" review and implements modern web performance optimizations, a sticky navigational system, scroll-spy Table of Contents, interactive tool search engine, and a product comparison matrix.

---

## 🚀 Key Features

1. **Sticky Navigation Header**:
   - Double-row header (Logo + Category menu) pinning smoothly on scroll.
   - Live search input that dynamically filters and highlights matches inside product cards.
2. **Scroll-Spy Table of Contents**:
   - Left-column sticky panel tracking scroll progress and highlighting active sections in real-time.
   - Click-to-scroll smooth navigation.
3. **High-Fidelity Product Review Cards**:
   - Custom badges for selection ranking ("Our Pick" and "Runner-up").
   - Side-by-side grids with generated product illustrations, structured pricing, key specifications, and custom green/red pros & cons panels.
4. **Interactive Toolkit Comparison Table**:
   - Dynamic comparison matrix comparing Anvil vs. WorkPro across 8 key tool metrics (Level, Tape Measure size, Hex keys, etc.).
5. **Affiliate Link Redirection Simulator**:
   - A simulated affiliate explanation popover warning readers about cookies and referral commissions upon clicking merchant call-to-actions, matching real-world affiliate disclosure compliance.
6. **Newsletter & Community Features**:
   - Simulated email registration and reader comment sections.

---

## 🛠️ Tech Stack

- **Core**: React 19, JavaScript (ES6+), Vite 8
- **Styling**: Tailwind CSS v4 (CSS-first configurations, Google Fonts Inter & Lora, smooth scroll configurations)
- **Tooling**: PostCSS 8 with `@tailwindcss/postcss` integration

---

## 💻 Local Development Setup

Follow these steps to run the application locally:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (version 18+ is recommended).

### 1. Install Dependencies
Navigate to the project directory and run:
```bash
npm install
```

### 2. Run the Development Server
Launch the local Vite server:
```bash
npm run dev
```
By default, the server runs at: **`http://localhost:5173`**

### 3. Build for Production
To generate optimized production-ready HTML, CSS, and JS assets in the `dist/` directory:
```bash
npm run build
```

---

## 🌐 Production Deployment Guide

Since this is a client-side Single Page Application (SPA), the build output in the `dist` folder can be hosted for free on any static host.

### Option 1: Deploy to Vercel (Recommended)
Vercel is the fastest platform to deploy React Vite applications.

#### Deploy via Vercel CLI:
1. Install the CLI globally (if not already installed):
   ```bash
   npm install -g vercel
   ```
2. Run the deploy command from the project root:
   ```bash
   vercel
   ```
3. Follow the CLI prompts:
   - *Set up and deploy?* Yes
   - *Which scope?* (Select your account)
   - *Link to existing project?* No
   - *What's your project's name?* `reviewsmart-toolkit-clone`
   - *In which directory is your code located?* `./`
   - *Want to modify settings?* No (Vite is auto-detected)
4. For production builds, run:
   ```bash
   vercel --prod
   ```

---

### Option 2: Deploy to Netlify
Netlify offers excellent support for static site builds.

#### Deploy via Netlify Dashboard:
1. Commit and push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Log in to [Netlify](https://www.netlify.com/) and click **Add new site** > **Import an existing project**.
3. Authorize your Git provider and select this repository.
4. Set the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy site**.

#### Deploy via Netlify CLI:
1. Install the CLI:
   ```bash
   npm install -g netlify-cli
   ```
2. Build the project locally:
   ```bash
   npm run build
   ```
3. Deploy the `dist` directory:
   ```bash
   netlify deploy --dir=dist --prod
   ```

---

### Option 3: Deploy to GitHub Pages
To publish the site as a GitHub User/Project Page:

1. Install the `gh-pages` package:
   ```bash
   npm install -D gh-pages
   ```
2. Add deployment scripts in `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Make sure to update the `base` configuration in `vite.config.js` if deploying to a sub-path (e.g. `https://<username>.github.io/<repository-name>/`):
   ```javascript
   // vite.config.js
   export default defineConfig({
     base: '/repository-name/', // Add this line
     plugins: [react(), tailwindcss()]
   })
   ```
4. Run the deploy script:
   ```bash
   npm run deploy
   ```
5. In your GitHub Repository Settings, navigate to **Pages** and verify the source is set to the `gh-pages` branch.
