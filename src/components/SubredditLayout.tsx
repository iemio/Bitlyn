import SubscribeLeaveToggle from "@/components/SubscribeLeaveToggle";
import ToFeedButton from "@/components/ToFeedButton";
import { buttonVariants } from "@/components/ui/Button";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

const SubredditLayout = async ({
    children,
    slug,
}: {
    children: ReactNode;
    slug: string;
}) => {};

export default SubredditLayout;
