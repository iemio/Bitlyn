import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

type UserId = string;

declare module "next-auth/jwt" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface JWT {
        id: UserId;
        username?: string | null;
    }
}

declare module "next-auth" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Session {
        user: User & {
            id: UserId;
            username?: string | null;
        };
    }
}
