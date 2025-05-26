// functions/index.js
const {onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");

admin.initializeApp();
const db = admin.firestore();

const TARGET_URL = "http://books.toscrape.com/";
const ARTICLE_SELECTOR = "article.product_pod";
const TITLE_SELECTOR = "h3 > a";
const PRICE_SELECTOR = "div.product_price > p.price_color";

const ADMIN_EMAIL = ""; // Define admin email

exports.scrapeData = onCall(
    {
      timeoutSeconds: 120,
      memory: "256MB",
      // region: "preferred-region",
    }, // Trailing comma
    async (request) => {
      // ADD: Authentication and Authorization Check
      if (!request.auth) {
        logger.error("Scrape attempt by unauthenticated user.");
        throw new onCall.HttpsError(
            "unauthenticated",
            "You must be logged in to perform this action.",
        );
      }

      if (request.auth.token.email !== ADMIN_EMAIL) {
        logger.warn(
            `Unauthorized scrape attempt by: ${request.auth.token.email}`,
        );
        throw new onCall.HttpsError(
            "permission-denied",
            "You do not have permission to perform this action.",
        );
      }
      // END: Authentication and Authorization Check

      try {
        const userEmailForLog = request.auth.token.email;
        // Break the long log message onto multiple lines
        logger.info(
            `Scrape by ${userEmailForLog}`,
            "found many items.", // Further break the string
        );
        const response = await axios.get(TARGET_URL);
        const html = response.data;
        const $ = cheerio.load(html);
        const scrapedItems = [];

        $(ARTICLE_SELECTOR).each((index, element) => {
          const titleElement = $(element).find(TITLE_SELECTOR);
          const title = titleElement.attr("title") ||
            titleElement.text().trim();
          const relativeLink = titleElement.attr("href");
          const price = $(element).find(PRICE_SELECTOR).text().trim();

          if (title && relativeLink && price) {
            const absoluteLink = new URL(relativeLink, TARGET_URL).href;
            scrapedItems.push({
              title: title,
              price: price,
              url: absoluteLink,
              source: "books.toscrape.com",
              scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        });

        logger.info(`Found ${scrapedItems.length} items.`);

        if (scrapedItems.length > 0) {
          const batch = db.batch();
          const collectionRef = db.collection("scrapedBooksData");

          scrapedItems.forEach((item) => {
            const docId = item.url.replace(/[^a-zA-Z0-9]/g, "_");
            const docRef = collectionRef.doc(docId);
            batch.set(docRef, item, {merge: true});
          });

          await batch.commit();
          logger.info(
              "Book data saved to Firestore successfully by admin.",
          );

          const successMessage =
            `${scrapedItems.length} books scraped and saved/updated.`;
          return {
            success: true,
            message: successMessage,
          };
        } else {
          logger.info(
              "No books found to scrape on the first page.",
          );
          return {
            success: false,
            message: "No new books found to scrape.",
          };
        }
      } catch (error) {
        logger.error(
            "Error scraping book data:",
            error, // Log the full error object
        );
        throw new onCall.HttpsError(
            "internal",
            "Failed to scrape book data.",
            error.message,
        );
      }
    }, // Trailing comma
);

exports.getScrapedBooks = onCall(
    {
      // region: "preferred-region", // Optional: specify region
    }, // Trailing comma
    async (request) => {
      const defaultLimit = 50;
      // Break the ternary operator for limit to fix max-len
      const limit = (request.data && request.data.limit) ?
        request.data.limit :
        defaultLimit;

      try {
        const snapshot = await db.collection("scrapedBooksData")
            .orderBy("scrapedAt", "desc")
            .limit(limit)
            .get();

        const items = [];
        snapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data(),
          });
        }); // Closing forEach

        return {success: true, data: items};
      } catch (error) {
        logger.error(
            "Error fetching book data:",
            error.message, // Log the primary error message
        );
        // Break HttpsError arguments for max-len
        throw new onCall.HttpsError(
            "internal", // code
            "Failed to fetch book data.", // message
            error.message, // details
        );
      }
    }, // Closing async (request) 
); // Closing onCall for getScrapedBooks
// Ensure there's a newline character below this line


