# Admin Panel with Web Scraper

## Project Overview

This project is a cloud-based web admin panel that scrapes data from a public website, stores it in a cloud database (Firebase Firestore), and displays it in a table on an admin dashboard. The entire application (frontend and backend) is hosted on Firebase.

Admins can trigger on-demand scraping, view scraped data with pagination and sorting, and manage access based on user roles (admin vs. regular authenticated user). The scraper can be configured to target different websites using pre-defined configurations or by manually inputting URLs and CSS selectors.

**Live Demo URL:** [Firebase Hosting URL Here - e.g., ]

---

## Features

* Simple user authentication (Firebase Auth).
* Admin role (e.g., `Choice`) with exclusive rights to:
    * Trigger web scraping.
    * Configure scraping targets (URL and CSS selectors).
* Regular authenticated users can view scraped data.
* Dynamic scraping:
    * Selection from pre-defined site configurations.
    * Option for custom input of Target URL and CSS selectors (Article, Title, Link, Price).
* Data stored in Firebase Firestore.
* Frontend displays scraped data in a sortable and paginated table.
* Frontend built with React and styled with React-Bootstrap.
* Backend scraper built with Node.js Firebase Functions, using `axios` and `cheerio`.

---

## Tech Stack

* **Frontend:** React (with Vite), React-Bootstrap
* **Backend:** Node.js (Firebase Functions v2)
* **Scraper Libraries:** `axios`, `cheerio`
* **Database:** Firebase Firestore
* **Authentication:** Firebase Authentication
* **Deployment:** Firebase Hosting (for frontend), Firebase Functions (for backend)

---

## Data Source Example

The primary example data source used for development and pre-defined configuration is [Books to Scrape](http://books.toscrape.com/), a sandbox website designed for web scraping practice. The application is also designed to allow admins to input configurations for other static HTML websites.

For `books.toscrape.com`, the selectors are:
* **Article/Item Selector:** `article.product_pod`
* **Title Selector:** `h3 > a`
* **Link Selector:** `h3 > a`
* **Price Selector:** `div.product_price > p.price_color`

Scraping Configuration: `books.toscrape.com` (Default)
For `quotes.toscrape.com` selectors are:
* **Article/Item Selector:** `div.quote`
* **Title Selector:** `span.text`
* **Link Selector:** `a`

---

## Project Structure
```text
admin-scraper/
├── functions/              # Firebase Functions (backend scraper API)
│   ├── node_modules/
│   ├── index.js            # Main backend logic
│   ├── package.json
│   ├── .eslintrc.js
├── frontend/               # React application (admin panel UI)
│   ├── node_modules/
│   ├── public/             # Static assets (e.g., favicon.ico, index.html shell)
│   ├── src/                # React source code
│   │   ├── components/     # React components (DashboardPage.jsx, LoginPage.jsx)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── firebaseConfig.js
│   │   └── index.css       # Global styles (Tailwind/Bootstrap imports)
│   ├── .env                # Firebase client config (gitignored)
│   ├── package.json
│   └── vite.config.js      # (if you have one)
├── .firebaserc             # Firebase project association
├── .gitignore              # Specifies intentionally untracked files
├── firebase.json           # Firebase project configuration (hosting, functions, firestore)
├── firestore.indexes.json  # Firestore indexes
├── firestore.rules         # Firestore security rules
└── README.md               # This file
```

---

## Setup and Installation (For Local Development)

1.  **Prerequisites:**
    * Node.js (v22.x recommended, as used for Firebase Functions runtime)
    * npm (comes with Node.js)
    * Firebase CLI installed and configured (`npm install -g firebase-tools`, then `firebase login`)

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/vishal-ekbote/admin-scraper.git
    cd admin-scraper
    ```

3.  **Firebase Project Setup:**
    * Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
    * Enable **Authentication** (e.g., Email/Password provider). Create your admin user (e.g., ``) and at least one non-admin test user.
    * Enable **Firestore Database** (start in test mode, then apply security rules).
    * Enable **Functions**.
    * Associate your local project with your Firebase project:
        ```bash
        firebase use --add
        ```
        Select your newly created project. This will update `.firebaserc`.

4.  **Configure Frontend Environment Variables:**
    * Navigate to the `frontend` directory: `cd frontend`
    * Copy `frontend/.env.example` to a new file named `frontend/.env`:
        ```bash
        cp .env.example .env 
        ```
        (On Windows, use `copy .env.example .env`)
    * Open `frontend/.env` and replace the placeholder values with your actual Firebase project's web app configuration details. You can find these in your Firebase project settings (Project settings > General > Your apps > SDK setup and configuration > Config).

5.  **Configure Backend Environment Variables (Admin Email Parameter):**
    In /functions/Index.js file add the admin gmail that only needs to access the scrape buttom

6.  **Install Dependencies:**
    * In the project root (`admin-scraper`):
        ```bash
        # No top-level npm install needed unless you have scripts there
        ```
    * In the `functions` directory:
        ```bash
        cd functions
        npm install
        cd .. 
        ```
    * In the `frontend` directory:
        ```bash
        cd frontend
        npm install
        cd ..
        ```

7.  **Run Locally:**

    * **Start Frontend Development Server:**
        Open another terminal, navigate to the `frontend` directory, and run:
        ```bash
        npm run dev
        ```
        Your application should be available at `http://localhost:5173` (or similar). The frontend should be configured (in `firebaseConfig.js`) to connect to emulators if you are running them.

    * **Start Backend Development Server:**
    In the project root, run: `firebase deploy --only functions`
---

## Deployment

1.  **Ensure you are logged into Firebase CLI:** `firebase login`
2.  **Lint Functions (Optional but good practice):**
    ```bash
    cd functions
    npm run lint
    cd ..
    ```
3.  **Build Frontend:**
    ```bash
    cd frontend
    npm run build
    cd ..
    ```
4.  **Deploy to Firebase:**
    From the project root (`admin-scraper`):
    ```bash
    firebase deploy 
    ```
    Or deploy specific parts:
    ```bash
    firebase deploy --only functions
    firebase deploy --only hosting
    firebase deploy --only firestore:rules
    ```

---

## Implementation Flow & Notes

* **Authentication:** Firebase Authentication handles user login/signup. The application differentiates between a designated admin email and other authenticated users.
* **Admin Panel (`DashboardPage.jsx`):**
    * Admins see options to select a pre-defined scraping configuration (URL + CSS selectors) or input a custom configuration.
    * The "Scrape Now" button, visible only to admins, triggers the `scrapeData` Firebase Function.
    * Other authenticated users can view the scraped data but cannot initiate scrapes or see admin controls.
* **Scraping (`functions/index.js` - `scrapeData`):**
    * An `onCall` Firebase Function.
    * Receives the target URL and CSS selectors from the frontend.
    * Performs an authorization check to ensure only the configured admin email can execute the scrape.
    * Uses `axios` to fetch HTML from the target URL.
    * Uses `cheerio` to parse HTML and extract data based on the provided selectors (article container, title, link, price).
    * Saves/updates scraped items in the `scrapedBooksData` Firestore collection, using the item's URL as a document ID to prevent duplicates and adding a `scrapedAt` server timestamp.
* **Data Fetching (`functions/index.js` - `getScrapedBooks`):**
    * An `onCall` Firebase Function.
    * Allows any authenticated user to fetch data from the `scrapedBooksData` collection.
    * Supports basic pagination via a `limit` parameter.
    * Data is ordered by `scrapedAt` timestamp.
* **Firestore Rules (`firestore.rules`):**
    * Allow `read` access to `scrapedBooksData` for any authenticated user.
    * Allow `write` access (create, update, delete) to `scrapedBooksData` only for the configured admin email.

---

## Challenges & Future Improvements

* **Selector Robustness:** CSS selector-based scraping is brittle and can break if website structures change.
* **JavaScript-Rendered Sites:** The current scraper (axios + cheerio) will not work effectively for sites that heavily rely on client-side JavaScript to render content. A headless browser like Puppeteer would be needed for such sites (requiring changes to the Firebase Function environment, possibly increasing costs/complexity).
* **Error Handling:** While basic error handling is in place, it could be made more granular for different types of scraping or network failures.
* **Scalability:** For very large-scale scraping, a more robust architecture (e.g., task queues, dedicated scraping infrastructure) would be needed.
* **Security for Custom URL Scraping:** Allowing arbitrary URL scraping, even by an admin, can have security implications (e.g., SSRF if not carefully managed, potential for abuse). For a production system, whitelisting domains or adding more checks would be advisable.
* **UI/UX:** The UI is functional but could be enhanced with more advanced features, better visual feedback, and more comprehensive error reporting.
