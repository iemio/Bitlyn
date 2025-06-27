"use client";

import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import * as React from "react";
import { FC } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "./Icons";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

const UserAuthForm: FC<UserAuthFormProps> = ({ className, ...props }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const loginWithGithub = async () => {
        setIsLoading(true);

        try {
            await signIn("github");
        } catch (error) {
            toast({
                title: "Error",
                description: "There was an error logging in with Google",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex justify-center", className)} {...props}>
            <Button
                isLoading={isLoading}
                type="button"
                size="sm"
                className="w-full"
                onClick={loginWithGithub}
                disabled={isLoading}
            >
                {isLoading ? null : <Icons.google className="h-4 w-4 mr-2" />}
                Google
            </Button>
        </div>
    );
};

export default UserAuthForm;
