import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

export async function generateMetadata(
    title: string,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any
): Promise<{
    summary: string;
    tags: string[];
    category: string;
    sentiment: "positive" | "negative" | "neutral";
}> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const contentText =
        typeof content === "string" ? content : JSON.stringify(content);
    const prompt = `
    Analyze this Reddit post and provide metadata in JSON format:

    Title: ${title}
    Content: ${contentText}

    Provide:
    1. A brief summary (max 150 characters)
    2. Relevant tags (3-5 tags)
    3. Category (technology, entertainment, news, discussion, question, etc.)
    4. Sentiment (positive, negative, or neutral)

    Respond only with valid JSON in this format:
    {
        "summary": "brief summary here",
        "tags": ["tag1", "tag2", "tag3"],
        "category": "category_name",
        "sentiment": "positive|negative|neutral"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    try {
        return JSON.parse(response);
    } catch (error) {
        console.error("Failed to parse Gemini response:", error);
        return {
            summary: title.substring(0, 150),
            tags: [],
            category: "general",
            sentiment: "neutral",
        };
    }
}
