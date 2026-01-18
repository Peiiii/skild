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
import { PageHero } from '@/components/ui/page-hero';

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
        <div className="space-y-12">
            <PageHero
                title="Leaderboard"
                description="Most installed skills across the Skild network. Equip your agents with what's trending."
                actions={
                    <div className="flex flex-wrap items-center gap-3 bg-brand-forest/[0.03] p-1.5 rounded-full border border-brand-forest/5">
                        <div className="flex items-center gap-1 bg-white/50 rounded-full p-1 shadow-sm">
                            <Button
                                variant={type === 'all' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-8 text-[11px] px-4 font-bold rounded-full"
                                onClick={() => setType('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={type === 'registry' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-8 text-[11px] px-4 font-bold rounded-full"
                                onClick={() => setType('registry')}
                            >
                                Registry
                            </Button>
                            <Button
                                variant={type === 'linked' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-8 text-[11px] px-4 font-bold rounded-full"
                                onClick={() => setType('linked')}
                            >
                                Linked
                            </Button>
                        </div>
                        <div className="w-px h-4 bg-brand-forest/10 mx-1" />
                        <div className="flex items-center gap-1 bg-white/50 rounded-full p-1 shadow-sm">
                            <Button
                                variant={period === '7d' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-8 text-[11px] px-4 font-bold rounded-full"
                                onClick={() => setPeriod('7d')}
                            >
                                7 Days
                            </Button>
                            <Button
                                variant={period === '30d' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-8 text-[11px] px-4 font-bold rounded-full"
                                onClick={() => setPeriod('30d')}
                            >
                                30 Days
                            </Button>
                            <Button
                                variant={period === '90d' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-8 text-[11px] px-4 font-bold rounded-full"
                                onClick={() => setPeriod('90d')}
                            >
                                90 Days
                            </Button>
                        </div>
                    </div>
                }
            />

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
                <div className="border border-brand-forest/15 rounded-[24px] overflow-hidden bg-white shadow-xl shadow-brand-forest/[0.05]">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-brand-forest/[0.05] text-[9px] font-black uppercase tracking-[0.2em] text-brand-forest/60 border-b border-brand-forest/15">
                                <th className="px-6 py-4 w-16 sm:w-20 text-center">Rank</th>
                                <th className="px-4 py-4">Skill</th>
                                <th className="hidden sm:table-cell px-5 py-4 text-center w-24">Installs</th>
                                <th className="px-6 py-4 text-right w-24 sm:w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const id = `${item.type}:${item.sourceId}`;
                                const isLinked = item.type === 'linked';
                                
                                return (
                                    <tr key={item.sourceId} className="group border-b border-brand-forest/10 last:border-0 hover:bg-brand-forest/[0.02] transition-all text-sm">
                                        <td className="px-6 py-5 text-center font-serif font-black text-brand-forest/30 group-hover:text-brand-forest transition-colors text-base italic">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-forest/5 flex items-center justify-center transition-transform group-hover:scale-105 hidden xs:flex">
                                                    {isLinked ? (
                                                        <Github className="h-5 w-5 text-brand-eco" />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-brand-forest" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <Link to={isLinked ? `/linked/${encodeURIComponent(item.sourceId)}` : `/skills/${item.sourceId.split('/')[0]}/${item.sourceId.split('/')[1]}`} className="font-serif text-base font-bold text-brand-forest hover:text-brand-eco transition-colors block truncate">
                                                        {item.title}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant={isLinked ? 'eco' : 'forest'} className="px-1.5 text-[8px] h-3.5 leading-none uppercase tracking-widest font-black shrink-0">
                                                            {isLinked ? 'Linked' : 'Registry'}
                                                        </Badge>
                                                        {/* Mobile-only Installs and copy link hint */}
                                                        <div className="flex sm:hidden items-center gap-1.5 text-[10px] font-bold text-brand-eco ml-1">
                                                            <Download className="h-2.5 w-2.5" />
                                                            {item.downloads}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-5 py-3 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xl font-serif font-bold text-brand-forest leading-none">{item.downloads}</span>
                                                <TrendingUp className="h-2.5 w-2.5 text-brand-eco opacity-40 mt-1" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="hidden xl:block">
                                                    <code className="text-[10px] text-brand-forest/20 font-mono mr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {item.install}
                                                    </code>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 w-8 sm:h-8 sm:w-auto sm:px-3 rounded-lg sm:rounded-full shadow-sm text-xs p-0 sm:p-auto flex items-center justify-center shrink-0"
                                                    onClick={() => void copyInstall(item)}
                                                >
                                                    {copiedId === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                                    <span className="hidden sm:inline ml-2">{copiedId === id ? 'Copied' : 'Copy'}</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {items.length === 0 && !busy && (
                        <div className="py-24 text-center space-y-4">
                            <div className="w-16 h-16 bg-brand-forest/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="h-8 w-8 text-brand-forest/20" />
                            </div>
                            <p className="text-brand-forest/40 font-serif italic text-lg">No stats available for this period.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
