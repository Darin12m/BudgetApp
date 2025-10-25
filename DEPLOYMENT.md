# Firebase Cloud Functions Deployment Instructions

This project includes Firebase Cloud Functions for server-side automation, specifically for updating investment prices and saving daily portfolio snapshots.

## 1. Install Dependencies for Functions

Navigate to the `functions` directory and install its dependencies:

```bash
cd functions
npm install
```

## 2. Configure Environment Variables

Your Cloud Functions require API keys to fetch data from Finnhub. These keys should be stored securely as Firebase environment configurations, not hard-coded in the function code.

Set your Finnhub API key:

```bash
firebase functions:config:set finnhub.key="YOUR_FINNHUB_API_KEY"
```

Replace `"YOUR_FINNHUB_API_KEY"` with your actual Finnhub API key.

To verify your configuration, you can run:

```bash
firebase functions:config:get
```

## 3. Deploy Cloud Functions

Ensure you are in the root directory of your Firebase project (where `firebase.json` is located).

```bash
firebase deploy --only functions
```

This command will build and deploy the `updateInvestmentPrices` and `saveDailyPortfolioSnapshot` functions to your Firebase project.

### Scheduled Functions

The `updateInvestmentPrices` function is scheduled to run `every 5 minutes`.
The `saveDailyPortfolioSnapshot` function is scheduled to run `every 24 hours`.

Firebase automatically sets up Cloud Scheduler jobs for these functions upon deployment. You can monitor their execution and logs in the Firebase console under "Functions" and "Cloud Scheduler".

## 4. Client-side Environment Variables

Remember to also set up your client-side environment variables for the React app. Create a `.env` file in the root of your project (next to `package.json`) with the following structure:

```
VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
VITE_FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID"

# NOTE: The Finnhub API key is now primarily used by Cloud Functions.
# It is kept here for client-side forms that might need to validate symbols,
# but actual price fetching for live updates is handled server-side.
VITE_FINNHUB_API_KEY="YOUR_FINNHUB_API_KEY"
```

## 5. Firestore Indexes

The following Firestore indexes are required for efficient querying, especially for date-range queries on `portfolioSnapshots` and `transactions`:

*   **Collection**: `portfolioSnapshots`
    *   **Fields**: `ownerUid` (Ascending), `date` (Ascending)
*   **Collection**: `transactions`
    *   **Fields**: `ownerUid` (Ascending), `date` (Ascending)

Firebase will often suggest these indexes in the console if you run queries that require them. You can create them manually in the Firestore console under "Indexes" or define them in a `firestore.indexes.json` file and deploy them with `firebase deploy --only firestore:indexes`.