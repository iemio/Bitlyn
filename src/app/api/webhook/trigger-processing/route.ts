import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const webhookUrl = `${process.env.VERCEL_URL}/api/background/process-posts`;

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WEBHOOK_SECRET}`,
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();

        return NextResponse.json({
            message: "Webhook triggered successfully",
            result,
        });
    } catch (error) {
        console.error("Webhook trigger error:", error);
        return NextResponse.json(
            { error: "Failed to trigger webhook" },
            { status: 500 }
        );
    }
}
