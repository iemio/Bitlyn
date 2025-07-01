import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const session = await getAuthSession();

    let followedCommunitiesIds: string[] = [];

    if (session) {
        const followedCommunities = await db.subscription.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                subreddit: true,
            },
        });

        followedCommunitiesIds = followedCommunities.map(
            (sub: any) => sub.subreddit.id
        );
    }

    try {
        const { limit, page, subredditName, searchQuery } = z
            .object({
                limit: z.string(),
                page: z.string(),
                subredditName: z.string().nullish().optional(),
                searchQuery: z.string().nullish().optional(),
            })
            .parse({
                subredditName: url.searchParams.get("subredditName"),
                limit: url.searchParams.get("limit"),
                page: url.searchParams.get("page"),
                searchQuery: url.searchParams.get("searchQuery"),
            });

        // If there's a search query, use vector search
        if (searchQuery) {
            const vectorSearchResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/search/vector`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: searchQuery,
                        limit: parseInt(limit),
                        subredditName,
                    }),
                }
            );

            if (vectorSearchResponse.ok) {
                const vectorResults = await vectorSearchResponse.json();
                const postIds = vectorResults.results.map((r: any) => r.postId);

                if (postIds.length > 0) {
                    const posts = await db.post.findMany({
                        where: {
                            id: {
                                in: postIds,
                            },
                        },
                        include: {
                            subreddit: true,
                            votes: true,
                            author: true,
                            comments: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    });

                    return new Response(JSON.stringify(posts));
                }
            }
        }

        // Regular database search (existing logic)
        let whereClause = {};

        if (subredditName) {
            whereClause = {
                subreddit: {
                    name: subredditName,
                },
            };
        } else if (session) {
            whereClause = {
                subreddit: {
                    id: {
                        in: followedCommunitiesIds,
                    },
                },
            };
        }

        const posts = await db.post.findMany({
            take: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
            orderBy: {
                createdAt: "desc",
            },
            include: {
                subreddit: true,
                votes: true,
                author: true,
                comments: true,
            },
            where: whereClause,
        });

        return new Response(JSON.stringify(posts));
    } catch (error) {
        console.error("Fetch posts error:", error);
        return new Response("Could not fetch posts", { status: 500 });
    }
}
