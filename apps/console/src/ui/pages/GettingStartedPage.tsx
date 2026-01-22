import * as React from 'react';
import { Link } from 'react-router-dom';
import { Check, Compass, Layers, ExternalLink } from 'lucide-react';
import { CodeBlock } from '@/components/ui/code-block';

export function GettingStartedPage(): JSX.Element {
    const [copied, setCopied] = React.useState(false);

    async function copyInstall(): Promise<void> {
        await navigator.clipboard.writeText('npm install -g skild');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4 py-6 sm:py-8">
                <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-brand-forest">Get Started with Skild</h1>
                <p className="text-lg sm:text-xl text-brand-forest/60 font-medium italic">
                    Install skills for your AI agents in seconds.
                </p>
            </div>

            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-forest text-white flex items-center justify-center font-serif font-bold text-lg shadow-lg shadow-brand-forest/10">1</div>
                    <h2 className="text-2xl font-serif font-bold text-brand-forest">Install the CLI</h2>
                </div>
                <CodeBlock copyValue="npm install -g skild">
                    <span className="text-brand-eco opacity-60 mr-3 select-none">$</span>
                    npm install -g skild
                </CodeBlock>
                <p className="text-sm text-brand-forest/60 font-medium px-2">
                    Requires Node.js 18+. You can also use <code className="bg-brand-forest/5 px-2 py-0.5 rounded-full text-brand-forest font-bold">pnpm</code> or <code className="bg-brand-forest/5 px-2 py-0.5 rounded-full text-brand-forest font-bold">yarn</code>.
                </p>
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-forest text-white flex items-center justify-center font-serif font-bold text-lg shadow-lg shadow-brand-forest/10">2</div>
                    <h2 className="text-2xl font-serif font-bold text-brand-forest">Install a Skill</h2>
                </div>
                <CodeBlock innerClassName="space-y-3">
                    <div className="text-white/40 italic font-medium select-none"># From the registry</div>
                    <div className="flex items-center gap-2">
                        <span className="text-brand-eco opacity-60 select-none">$</span>
                        <span>skild install @publisher/skill-name</span>
                    </div>
                    <div className="mt-6 text-white/40 italic font-medium select-none"># From GitHub</div>
                    <div className="flex items-center gap-2">
                        <span className="text-brand-eco opacity-60 select-none">$</span>
                        <span>skild install owner/repo/path/to/skill</span>
                    </div>
                </CodeBlock>
                <p className="text-sm text-brand-forest/60 font-medium px-2">
                    Browse available skills on the <Link to="/skills" className="text-brand-forest font-bold underline underline-offset-4 hover:text-brand-eco transition-colors">Skills</Link> page.
                </p>
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-forest text-white flex items-center justify-center font-serif font-bold text-lg shadow-lg shadow-brand-forest/10">3</div>
                    <h2 className="text-2xl font-serif font-bold text-brand-forest">Use with Your Agent</h2>
                </div>
                <CodeBlock innerClassName="space-y-3">
                    <div className="text-brand-eco flex items-center gap-2 font-bold">
                        <Check className="h-4 w-4" />
                        Installed to ~/.claude/skills/skill-name
                    </div>
                    <div className="text-white/40 italic font-medium mt-3 select-none"># Your agent automatically discovers and uses the skill</div>
                </CodeBlock>
                <p className="text-sm text-brand-forest/60 font-medium px-2">
                    Skild supports Claude, Codex, Windsurf, OpenCode, and Copilot. Use <code className="bg-brand-forest/5 px-2 py-0.5 rounded-full text-brand-forest font-bold">-t windsurf</code> to target other platforms.
                </p>
            </section>

            <section className="rounded-[24px] border border-brand-forest/5 bg-white p-6 space-y-6 shadow-xl shadow-brand-forest/[0.02]">
                <h2 className="text-2xl font-serif font-bold text-brand-forest">Next Steps</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    <Link
                        to="/skills"
                        className="flex items-center gap-3 p-4 rounded-[16px] bg-brand-forest/[0.02] border border-brand-forest/5 hover:bg-brand-forest/[0.05] hover:border-brand-forest/10 transition-all group"
                    >
                        <Compass className="h-5 w-5 text-brand-forest group-hover:text-brand-eco transition-colors" />
                        <div>
                            <div className="font-bold text-[13px] text-brand-forest">Browse Skills</div>
                            <div className="text-[10px] text-brand-forest/40 font-medium">Discover capabilities</div>
                        </div>
                    </Link>
                    <Link
                        to="/skills?type=skillset"
                        className="flex items-center gap-3 p-4 rounded-[16px] bg-brand-forest/[0.02] border border-brand-forest/5 hover:bg-brand-forest/[0.05] hover:border-brand-forest/10 transition-all group"
                    >
                        <Layers className="h-5 w-5 text-brand-forest group-hover:text-brand-eco transition-colors" />
                        <div>
                            <div className="font-bold text-[13px] text-brand-forest">Skillsets</div>
                            <div className="text-[10px] text-brand-forest/40 font-medium">Install skill packs</div>
                        </div>
                    </Link>
                    <a
                        href="https://github.com/Peiiii/skild"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-4 rounded-[16px] bg-brand-forest/[0.02] border border-brand-forest/5 hover:bg-brand-forest/[0.05] hover:border-brand-forest/10 transition-all group"
                    >
                        <ExternalLink className="h-5 w-5 text-brand-forest group-hover:text-brand-eco transition-colors" />
                        <div>
                            <div className="font-bold text-[13px] text-brand-forest">Documentation</div>
                            <div className="text-[10px] text-brand-forest/40 font-medium">Full guides on GitHub</div>
                        </div>
                    </a>
                </div>
            </section>
        </div>
    );
}
