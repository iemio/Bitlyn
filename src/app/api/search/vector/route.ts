import { NextRequest, NextResponse } from "next/server";
import { qdrantClient, COLLECTION_NAME } from "@/lib/qdrant";
import { generateEmbedding } from "@/lib/gemini";
import { z } from "zod";

const SearchValidator = z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(50).default(10),
    threshold: z.number().min(0).max(1).default(0.7),
    subredditName: z.string().optional(),
    category: z.string().optional(),
    sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, limit, threshold, subredditName, category, sentiment } =
            SearchValidator.parse(body);

        // Generate embedding for search query
        const queryEmbedding = await generateEmbedding(query);

        // Build filter conditions
        const filter: any = {};

        if (subredditName) {
            filter.subredditName = subredditName;
        }

        if (category) {
            filter.category = category;
        }

        if (sentiment) {
            filter.sentiment = sentiment;
        }

        // Search in Qdrant
        const searchResult = await qdrantClient.search(COLLECTION_NAME, {
            vector: queryEmbedding,
            limit,
            score_threshold: threshold,
            filter:
                Object.keys(filter).length > 0
                    ? {
                          must: Object.entries(filter).map(([key, value]) => ({
                              key,
                              match: { value },
                          })),
                      }
                    : undefined,
            with_payload: true,
        });

        // Format results
        const results = searchResult.map((result) => ({
            postId: result.id,
            score: result.score,
            title: result.payload?.title,
            summary: result.payload?.summary,
            subredditName: result.payload?.subredditName,
            authorName: result.payload?.authorName,
            tags: result.payload?.tags,
            category: result.payload?.category,
            sentiment: result.payload?.sentiment,
            createdAt: result.payload?.createdAt,
        }));

        return NextResponse.json({
            query,
            results,
            total: results.length,
        });
    } catch (error) {
        console.error("Vector search error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
