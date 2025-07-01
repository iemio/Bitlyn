import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY,
});

export const COLLECTION_NAME = "reddit_posts";

// Initialize collection if it doesn't exist
export async function initializeQdrantCollection() {
    try {
        await qdrantClient.getCollection(COLLECTION_NAME);
    } catch (error) {
        // Collection doesn't exist, create it
        await qdrantClient.createCollection(COLLECTION_NAME, {
            vectors: {
                size: 768, // Gemini embedding size
                distance: "Cosine",
            },
        });
        console.log(`Created Qdrant collection: ${COLLECTION_NAME}`);
    }
}
