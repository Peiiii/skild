import React from 'react';
import { Loader2 } from 'lucide-react';

export function PageLoading(): JSX.Element {
    return (
        <div className="flex flex-col items-center justify-center py-24 min-h-[400px] w-full animate-in fade-in duration-500">
            <div className="relative">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 h-10 w-10 bg-indigo-500/10 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
                Loading...
            </p>
        </div>
    );
}
