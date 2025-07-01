import SubredditLayout from "@/components/SubredditLayout";
import type { Metadata } from "next";
import { ReactNode } from "react";
export const metadata: Metadata = {
    title: "Bitlyn",
    description: "A Reddit clone built with Next.js and TypeScript.",
};

export default function Layout({
    children,
    params,
}: {
    children: ReactNode;
    params: { slug: string };
}) {
    return <SubredditLayout slug={params.slug}>{children}</SubredditLayout>;
}
