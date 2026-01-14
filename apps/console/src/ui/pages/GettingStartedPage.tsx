import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, Terminal, Package, Layers, Compass } from 'lucide-react';

export function GettingStartedPage(): JSX.Element {
    const [copied, setCopied] = React.useState(false);

    async function copyInstall(): Promise<void> {
        await navigator.clipboard.writeText('npm install -g skild');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="max-w-3xl mx-auto space-y-12">
            {/* Hero */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black tracking-tight">Get Started with Skild</h1>
                <p className="text-lg text-muted-foreground">
                    Install skills for your AI agents in seconds.
                </p>
            </div>

            {/* Step 1: Install */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">1</div>
                    <h2 className="text-xl font-bold">Install the CLI</h2>
                </div>
                <div className="relative group">
                    <div className="rounded-xl bg-black/60 border border-border/40 p-4 font-mono text-sm text-indigo-300 pr-14">
                        npm install -g skild
                    </div>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 hover:bg-white/10"
                        onClick={() => void copyInstall()}
                    >
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Requires Node.js 18+. You can also use <code className="bg-muted/50 px-1 rounded">pnpm</code> or <code className="bg-muted/50 px-1 rounded">yarn</code>.
                </p>
            </section>

            {/* Step 2: Install a Skill */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">2</div>
                    <h2 className="text-xl font-bold">Install a Skill</h2>
                </div>
                <div className="rounded-xl bg-black/60 border border-border/40 p-4 font-mono text-sm space-y-2">
                    <div className="text-muted-foreground"># From the registry</div>
                    <div className="text-indigo-300">skild install @publisher/skill-name</div>
                    <div className="mt-3 text-muted-foreground"># From GitHub</div>
                    <div className="text-indigo-300">skild install owner/repo/path/to/skill</div>
                </div>
                <p className="text-sm text-muted-foreground">
                    Browse available skills on the <Link to="/skills" className="text-indigo-400 hover:underline">Skills</Link> page.
                </p>
            </section>

            {/* Step 3: Use with your agent */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">3</div>
                    <h2 className="text-xl font-bold">Use with Your Agent</h2>
                </div>
                <div className="rounded-xl bg-black/60 border border-border/40 p-4 font-mono text-sm space-y-2">
                    <div className="text-emerald-400">✓ Installed to ~/.claude/skills/skill-name</div>
                    <div className="text-muted-foreground mt-2"># Your agent automatically discovers and uses the skill</div>
                </div>
                <p className="text-sm text-muted-foreground">
                    Skild supports Claude, Codex, and Copilot. Use <code className="bg-muted/50 px-1 rounded">-t codex</code> to target other platforms.
                </p>
            </section>

            {/* Next Steps */}
            <section className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
                <h2 className="text-lg font-bold">Next Steps</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    <Link
                        to="/skills"
                        className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
                    >
                        <Compass className="h-5 w-5 text-indigo-400" />
                        <div>
                            <div className="font-semibold text-sm">Browse Skills</div>
                            <div className="text-xs text-muted-foreground">Discover capabilities</div>
                        </div>
                    </Link>
                    <Link
                        to="/skillsets"
                        className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
                    >
                        <Layers className="h-5 w-5 text-purple-400" />
                        <div>
                            <div className="font-semibold text-sm">Skillsets</div>
                            <div className="text-xs text-muted-foreground">Install skill packs</div>
                        </div>
                    </Link>
                    <a
                        href="https://github.com/Peiiii/skild"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
                    >
                        <ExternalLink className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <div className="font-semibold text-sm">Documentation</div>
                            <div className="text-xs text-muted-foreground">Full guides on GitHub</div>
                        </div>
                    </a>
                </div>
            </section>
        </div>
    );
}
