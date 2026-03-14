"use client";

import { cn } from "@/lib/utils"
import { authHandler } from "@/utils/auth-handlers";
import { Button, FieldSeparator, Separator } from "@repo/ui"
import {
    Field,
    FieldGroup,
} from "@repo/ui";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    return (
        <form className={cn("flex flex-col gap-6", className)} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-[20px] tracking-[-0.2px] font-bold font-sans">Login to your account</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Click the below provider & login to your account
                    </p>
                </div>
                <Separator className="bg-white/20"/>
                <Field>
                    <Button variant="outline" type="button" className="flex justify-center items-center" onClick={authHandler}>
                        <svg className="mt-[0.8px]" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" fill="white" viewBox="0 0 30 30">
                            <path d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z"></path>
                        </svg>
                        Login with Google
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}
