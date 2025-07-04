import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { PostValidator } from "@/lib/validators/post";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { title, content, subredditId } = PostValidator.parse(body);

        const session = await getAuthSession();

        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        // verify user is subscribed to passed subreddit id
        const subscription = await db.subscription.findFirst({
            where: {
                subredditId,
                userId: session.user.id,
            },
        });

        if (!subscription) {
            return new Response("Subscribe to post", { status: 403 });
        }

        const post = await db.post.create({
            data: {
                title,
                content,
                authorId: session.user.id,
                subredditId,
            },
            include: {
                author: {
                    select: {
                        username: true,
                        name: true,
                    },
                },
                subreddit: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // Publish to Redis Queue for background processing
        const result = await redis.lpush(
            "post_processing_queue",
            JSON.stringify({
                postId: post.id,
                title: post.title,
                content: post.content,
                authorName: post.author.username || post.author.name,
                subredditName: post.subreddit.name,
                createdAt: post.createdAt.toISOString(),
            })
        );
        console.log("New Redis list length:", result);
        return new Response("OK");
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 400 });
        }

        return new Response(
            "Could not post to subreddit at this time. Please try later",
            { status: 500 }
        );
    }
}
