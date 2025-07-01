import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import {
    qdrantClient,
    COLLECTION_NAME,
    initializeQdrantCollection,
} from "@/lib/qdrant";
import { generateEmbedding, generateMetadata } from "@/lib/gemini";
import { db } from "@/lib/db";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        // Verify webhook signature if needed
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Initialize Qdrant collection
        await initializeQdrantCollection();

        // Process items from Redis queue
        const queueItems = await redis.lrange("post_processing_queue", 0, 9); // Process up to 10 items

        if (queueItems.length === 0) {
            return NextResponse.json({ message: "No items to process" });
        }

        const processedItems = [];

        for (const item of queueItems) {
            try {
                const postData = JSON.parse(item);

                // Generate metadata using Gemini
                const metadata = await generateMetadata(
                    postData.title,
                    postData.content
                );

                // Create text for embedding
                const embeddingText = `${postData.title} ${
                    typeof postData.content === "string"
                        ? postData.content
                        : JSON.stringify(postData.content)
                } ${metadata.tags.join(" ")}`;

                // Generate embedding
                const embedding = await generateEmbedding(embeddingText);

                // Store in Qdrant
                await qdrantClient.upsert(COLLECTION_NAME, {
                    points: [
                        {
                            id: postData.postId,
                            vector: embedding,
                            payload: {
                                postId: postData.postId,
                                title: postData.title,
                                content: postData.content,
                                authorName: postData.authorName,
                                subredditName: postData.subredditName,
                                createdAt: postData.createdAt,
                                summary: metadata.summary,
                                tags: metadata.tags,
                                category: metadata.category,
                                sentiment: metadata.sentiment,
                            },
                        },
                    ],
                });

                // Update post in database with metadata
                await db.post.update({
                    where: { id: postData.postId },
                    data: {
                        // Add metadata fields to your Prisma schema if needed
                        // metadata: {
                        //     summary: metadata.summary,
                        //     tags: metadata.tags,
                        //     category: metadata.category,
                        //     sentiment: metadata.sentiment,
                        // },
                    },
                });

                processedItems.push(postData.postId);

                // Remove processed item from queue
                await redis.lrem("post_processing_queue", 1, item);
            } catch (itemError) {
                console.error(`Error processing item ${item}:`, itemError);
                // Remove failed item from queue to prevent infinite retry
                await redis.lrem("post_processing_queue", 1, item);
            }
        }

        return NextResponse.json({
            message: `Processed ${processedItems.length} items`,
            processedIds: processedItems,
        });
    } catch (error) {
        console.error("Background processing error:", error);
        return NextResponse.json(
            { error: "Processing failed" },
            { status: 500 }
        );
    }
}
