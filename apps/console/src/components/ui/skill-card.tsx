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
                "group relative flex flex-col p-4 sm:p-5 h-full",
                !isLinked && isSkillset && "after:absolute after:inset-0 after:border after:border-brand-forest/10 after:rounded-[24px] after:-translate-x-1.5 after:translate-y-1.5 after:-z-10 before:absolute before:inset-0 before:border before:border-brand-forest/5 before:rounded-[24px] before:-translate-x-3 before:translate-y-3 before:-z-20"
            )}
        >
            <div className="flex flex-col h-full gap-3 sm:gap-4">
                {/* Row 1: Title & Origin */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        {href || detailsHref ? (
                            <Link
                                className="text-xl font-serif font-bold text-brand-forest hover:text-brand-eco transition-colors truncate block"
                                to={(href || detailsHref)!}
                                title={alias ? `${displayTitle} (${title})` : title}
                            >
                                {displayTitle}
                            </Link>
                        ) : (
                            <div className="text-xl font-serif font-bold text-brand-forest truncate" title={alias ? `${displayTitle} (${title})` : title}>
                                {displayTitle}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 mt-1">
                        {/* Downloads - In Row 1 */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/[0.04] text-emerald-600/70 text-[10px] font-bold" title="Installs">
                            <Download className="h-3.5 w-3.5 opacity-70" />
                            <span>
                                {downloads ? (
                                    currentSort === 'downloads_7d' ? downloads.sevenDays :
                                    currentSort === 'downloads_30d' ? downloads.thirtyDays :
                                    downloads.total
                                ) : 0}
                            </span>
                        </div>

                        {isLinked && source?.url ? (
                            <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-forest/40 hover:text-brand-eco transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="View on GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                        ) : (
                            <div className="text-brand-forest/40">
                                {isLinked ? <Github className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: Metadata Hub (Tags) */}
                <div className="flex flex-wrap items-center gap-2 -mt-2">
                    {/* Tags */}
                    {tags && tags.length > 0 && tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[9px] h-4.5 px-1.5 shrink-0 font-medium text-brand-forest/40 lowercase tracking-normal border-brand-forest/10">
                            #{tag}
                        </Badge>
                    ))}
                </div>

                {/* Row 3: Path / ID */}
                <div className="flex items-center gap-2 min-w-0 overflow-hidden text-[11px] text-brand-forest/60 -mt-1.5 px-0.5">
                    <span className="truncate font-mono font-medium leading-none">
                        {isLinked && source ? `${source.repo}${source.path ? ` / ${source.path}` : ''}` : id}
                    </span>
                    {/* Skillset Badge */}
                    {!isLinked && isSkillset && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] h-4 px-1.5 font-black uppercase tracking-[0.1em] shrink-0">
                            Skillset
                        </Badge>
                    )}
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-brand-forest/65 leading-relaxed line-clamp-2 h-9 font-medium italic">
                        {description || <span className="opacity-40">No description provided</span>}
                    </div>
                </div>

                {/* Footer Section */}
                <div className="space-y-3 pt-3 border-t border-brand-forest/10">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-brand-forest/30 px-0.5">
                            <span>Install Command</span>
                            {isCopied && <span className="text-brand-eco animate-in fade-in slide-in-from-right-1">Copied!</span>}
                        </div>
                        <div className="relative group/install">
                            <div className="rounded-xl bg-brand-forest/[0.03] border border-brand-forest/10 p-2.5 font-mono text-[10px] leading-tight break-all text-brand-forest/80 pr-10 min-h-[38px] flex items-center transition-colors group-hover/install:border-brand-forest/20">
                                {installCmd}
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-brand-forest/10 text-brand-forest/60"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCopyInstall?.(id, installCmd);
                                }}
                            >
                                {isCopied ? <Check className="h-3.5 w-3.5 text-brand-eco" /> : <Copy className="h-3.5 w-3.5 opacity-40 group-hover/install:opacity-100 transition-opacity" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {publisher && (
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-forest/50">
                                    <div className="w-4 h-4 rounded-full bg-brand-forest/5 flex items-center justify-center">
                                        <User className="h-2.5 w-2.5 opacity-60" />
                                    </div>
                                    <span>@{publisher.handle}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-[9px] text-brand-forest/40">
                                <Clock className="h-3 w-3 opacity-40" />
                                <span>{formatRelativeTime(createdAt)}</span>
                            </div>
                        </div>

                        <Badge variant={isLinked ? 'eco' : 'forest'} className="text-[9px] h-4.5 px-2 shrink-0 uppercase tracking-widest font-black rounded-md border-none opacity-60">
                            {isLinked ? 'Linked' : 'Registry'}
                        </Badge>
                    </div>
                </div>
            </div>
        </Card>
    );
}
