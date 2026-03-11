"use client"

import { authHandler } from '@/utils/auth-handlers';
import { Button } from '@repo/ui';
import { Github } from 'lucide-react';
import Link from 'next/link';

const LoginPage = () => {

    return (
        <section className='flex min-h-screen bg-zinc-50 dark:bg-transparent px-4 py-16 md:py-32 '>
            <div className='bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)] '>
                <div className='p-8 pb-6'>
                    <div>
                        <Link href={"/"}>
                            <h1 className='text-2xl font-bold'>Raven Claw</h1>
                        </Link>
                        <h1 className='mb-1 mt-4 text-xl font-semibold'>Sign in to Raven Claw</h1>
                        <p className="text-sm">Welcome back! Sign in to continue</p>
                    </div>

                    <div className='mt-6 grid grid-cols-1 gap-2'>
                        <Button variant='outline' className='w-full' onClick={authHandler}>
                            <Github className='mr-2 h-4 w-4' />
                            Sign in with Github
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default LoginPage;