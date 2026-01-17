import * as React from 'react';
import { Link } from 'react-router-dom';
import { Github, Package, User, Clock, Check, Copy, ExternalLink, Download, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkillsetBadge } from '@/components/skillset-badge';
import { isSkillsetFlag } from '@/lib/skillset';
import { formatRelativeTime } from '@/lib/time';
import { normalizeAlias, preferredDisplayName, preferredInstallCommand } from '@/lib/install';

export interface SkillCardProps {
    id: string;
    type: 'registry' | 'linked';
    title: string;
    description?: string | null;
    alias?: string | null;
    install: string;
    skillset?: boolean;
    source?: {
        repo: string | null;
        path: string | null;
        url?: string | null;
    } | null;
    publisher?: {
        handle: string;
    } | null;
    createdAt: string;
    downloads?: {
        total: number;
        sevenDays: number;
        thirtyDays: number;
    };
    tags?: string[];
    currentSort?: string;
    onCopyInstall?: (id: string, install: string) => void;
    isCopied?: boolean;
    href?: string;
    detailsHref?: string;
}

export function SkillCard({
    id,
    type,
    title,
    description,
    alias,
    install,
    skillset,
    source,
    publisher,
    createdAt,
    downloads,
    tags,
    currentSort,
    onCopyInstall,
    isCopied,
    href,
    detailsHref,
}: SkillCardProps) {
    const isLinked = type === 'linked';
    const displayTitle = preferredDisplayName({ title, alias });
    const installCmd = preferredInstallCommand({ install, alias });
    const isSkillset = isSkillsetFlag(skillset);

    return (
        <Card
            className={cn(
                "group relative flex flex-col p-5 h-full",
                !isLinked && isSkillset && "after:absolute after:inset-0 after:border after:border-brand-forest/10 after:rounded-[24px] after:-translate-x-1.5 after:translate-y-1.5 after:-z-10 before:absolute before:inset-0 before:border before:border-brand-forest/5 before:rounded-[24px] before:-translate-x-3 before:translate-y-3 before:-z-20"
            )}
        >
            <div className="flex flex-col h-full gap-3.5">
                <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                {href || detailsHref ? (
                                    <Link
                                        className="text-lg font-serif font-bold text-brand-forest hover:text-brand-eco transition-colors truncate"
                                        to={(href || detailsHref)!}
                                        title={alias ? `${displayTitle} (${title})` : title}
                                    >
                                        {displayTitle}
                                    </Link>
                                ) : (
                                    <div className="text-lg font-serif font-bold text-brand-forest truncate" title={alias ? `${displayTitle} (${title})` : title}>
                                        {displayTitle}
                                    </div>
                                )}
                                <Badge variant={isLinked ? 'eco' : 'forest'} className="text-[8px] h-3.5 px-1.5 shrink-0 uppercase tracking-wider font-bold">
                                    {isLinked ? 'Linked' : 'Registry'}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {alias && (
                                    <Badge variant="secondary" className="text-[9px] h-4 px-2 shrink-0 font-mono lowercase tracking-normal">
                                        {alias}
                                    </Badge>
                                )}
                                {!isLinked && isSkillset && <SkillsetBadge className="scale-75 origin-left" />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-brand-forest/70 font-bold">
                        {isLinked && source ? (
                            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                <Github className="h-2.5 w-2.5 shrink-0 opacity-60" />
                                <span className="truncate">{source.repo}{source.path ? ` / ${source.path}` : ''}</span>
                            </div>
                        ) : !isLinked ? (
                            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                <Package className="h-2.5 w-2.5 shrink-0 opacity-60" />
                                <code className="text-[9px] bg-brand-forest/10 text-brand-forest/80 px-1 py-0.5 rounded truncate max-w-full font-mono">{id}</code>
                            </div>
                        ) : null}
                    </div>

                    <div className="text-[10.5px] text-brand-forest/65 leading-relaxed line-clamp-2 h-8 font-medium italic">
                        {description || <span className="opacity-40">No description provided</span>}
                    </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-brand-forest/10">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.15em] text-brand-forest/40 px-0.5">
                            <span>Install Command</span>
                            {isCopied && <span className="text-brand-eco animate-in fade-in slide-in-from-right-1">Copied!</span>}
                        </div>
                        <div className="relative group/install">
                            <div className="rounded-lg bg-brand-forest/[0.03] border border-brand-forest/10 p-2 font-mono text-[10px] leading-tight break-all text-brand-forest/80 pr-8 min-h-[34px] flex items-center transition-colors group-hover/install:border-brand-forest/20">
                                {installCmd}
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-brand-forest/10 text-brand-forest/60"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCopyInstall?.(id, installCmd);
                                }}
                            >
                                {isCopied ? <Check className="h-3 w-3 text-brand-eco" /> : <Copy className="h-3 w-3 opacity-60 group-hover/install:opacity-100 transition-opacity" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[9px] text-brand-forest/50 font-bold">
                                <Clock className="h-2.5 w-2.5 opacity-60" />
                                <span>{formatRelativeTime(createdAt)}</span>
                            </div>
                            {downloads && (downloads.total > 0 || currentSort?.startsWith('downloads')) && (
                                <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600/80">
                                    <Download className="h-2.5 w-2.5" />
                                    <span>
                                        {currentSort === 'downloads_7d' ? downloads.sevenDays :
                                            currentSort === 'downloads_30d' ? downloads.thirtyDays :
                                                downloads.total}
                                    </span>
                                </div>
                            )}
                            {publisher && (
                                <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-brand-forest/50">
                                    <User className="h-2 w-2 opacity-60" />
                                    <span>By <span className="text-brand-forest/80 font-black">@{publisher.handle}</span></span>
                                </div>
                            )}
                        </div>
                        {isLinked && source?.url && (
                            <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] font-black text-brand-forest/50 hover:text-brand-eco transition-colors flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Source <ExternalLink className="h-2 w-2 opacity-60" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
