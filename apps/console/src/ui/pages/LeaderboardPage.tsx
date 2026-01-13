import React from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '@/lib/api';
import type { LeaderboardItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Trophy,
    Download,
    TrendingUp,
    Package,
    Github,
    Check,
    Copy,
    ArrowRight,
    Filter
} from 'lucide-react';

export function LeaderboardPage(): JSX.Element {
    const [items, setItems] = React.useState<LeaderboardItem[]>([]);
    const [period, setPeriod] = React.useState<'7d' | '30d' | '90d'>('7d');
    const [type, setType] = React.useState<'all' | 'registry' | 'linked'>('all');
    const [busy, setBusy] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    async function load(): Promise<void> {
        setBusy(true);
        setError(null);
        try {
            const res = await getLeaderboard(type, period, 50);
            if (!res.ok) {
                setError(res.error);
                setItems([]);
                return;
            }
            setItems(res.items);
        } catch (err: unknown) {
            if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
            else setError(err instanceof Error ? err.message : String(err));
            setItems([]);
        } finally {
            setBusy(false);
        }
    }

    React.useEffect(() => {
        void load();
    }, [period, type]);

    async function copyInstall(item: LeaderboardItem): Promise<void> {
        await navigator.clipboard.writeText(item.install);
        const id = `${item.type}:${item.sourceId}`;
        setCopiedId(id);
        window.setTimeout(() => {
            setCopiedId(current => (current === id ? null : current));
        }, 1500);
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-wider uppercase text-xs">
                        <Trophy className="h-4 w-4" />
                        <span>Top Skills</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
                    <p className="text-muted-foreground max-w-xl">
                        Most installed skills across the Skild network. Equip your agents with what's trending.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-secondary/20 p-1.5 rounded-xl border border-border/40">
                    <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
                        <Button
                            variant={type === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs px-3 font-bold"
                            onClick={() => setType('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={type === 'registry' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs px-3 font-bold"
                            onClick={() => setType('registry')}
                        >
                            Registry
                        </Button>
                        <Button
                            variant={type === 'linked' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs px-3 font-bold"
                            onClick={() => setType('linked')}
                        >
                            Linked
                        </Button>
                    </div>
                    <div className="w-px h-4 bg-border/40 mx-1" />
                    <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
                        <Button
                            variant={period === '7d' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs px-3 font-bold"
                            onClick={() => setPeriod('7d')}
                        >
                            7 Days
                        </Button>
                        <Button
                            variant={period === '30d' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs px-3 font-bold"
                            onClick={() => setPeriod('30d')}
                        >
                            30 Days
                        </Button>
                        <Button
                            variant={period === '90d' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs px-3 font-bold"
                            onClick={() => setPeriod('90d')}
                        >
                            90 Days
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error loading leaderboard</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {busy && items.length === 0 ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-secondary/20 animate-pulse border border-border/20" />
                    ))}
                </div>
            ) : (
                <div className="border rounded-2xl overflow-hidden border-border/40 bg-card/30 backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40">
                                <th className="px-6 py-4 w-16 text-center">#</th>
                                <th className="px-6 py-4">Skill</th>
                                <th className="px-6 py-4 text-center">Installs</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const id = `${item.type}:${item.sourceId}`;
                                const isLinked = item.type === 'linked';
                                const href = isLinked ? `/linked/${item.sourceId}` : `/skills/${item.sourceId.replace('/', '%2F')}`; // Simplified, router handles it

                                return (
                                    <tr key={id} className="group border-b border-border/20 last:border-0 hover:bg-secondary/20 transition-colors">
                                        <td className="px-6 py-4 text-center font-black text-muted-foreground group-hover:text-indigo-400 transition-colors">
                                            {idx + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                    {isLinked ? (
                                                        <Github className="h-5 w-5 text-emerald-400" />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-indigo-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link to={isLinked ? `/linked/${item.sourceId}` : `/skills/${item.sourceId.split('/')[0]}/${item.sourceId.split('/')[1]}`} className="font-bold hover:text-indigo-400 transition-colors block truncate">
                                                        {item.title}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant={isLinked ? 'emerald' : 'indigo'} className="px-1 text-[9px] h-3.5 leading-none uppercase tracking-tighter">
                                                            {isLinked ? 'Linked' : 'Registry'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xl font-black text-foreground/90">{item.downloads}</span>
                                                <TrendingUp className="h-3 w-3 text-emerald-500 opacity-50" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="hidden md:block">
                                                    <code className="text-[10px] text-muted-foreground mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {item.install}
                                                    </code>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 gap-2 font-bold text-xs"
                                                    onClick={() => void copyInstall(item)}
                                                >
                                                    {copiedId === id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                    <span className="hidden sm:inline">{copiedId === id ? 'Copied' : 'Copy'}</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {items.length === 0 && !busy && (
                        <div className="py-20 text-center space-y-3">
                            <TrendingUp className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                            <p className="text-muted-foreground font-medium">No stats available for this period.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
