import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, LogIn, FolderOpen, Rocket, Download, ChevronDown } from 'lucide-react';
import React from 'react';

export function PublishPage(): JSX.Element {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish your Skill</CardTitle>
        <CardDescription>Share your Skill with the community in just a few steps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 text-sm">
        {/* Step 1: Signup */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">1</div>
            <UserPlus className="w-4 h-4 text-indigo-400" />
            Sign up (first time only)
          </div>
          <pre className="rounded-xl border border-border/40 bg-black/40 p-4 text-xs font-mono text-foreground/90 overflow-auto">skild signup</pre>
          <p className="text-xs text-muted-foreground pl-1">Follow the prompts to enter your email, handle, and password.</p>
        </div>

        {/* Step 2: Login */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">2</div>
            <LogIn className="w-4 h-4 text-purple-400" />
            Login
          </div>
          <pre className="rounded-xl border border-border/40 bg-black/40 p-4 text-xs font-mono text-foreground/90 overflow-auto">skild login</pre>
          <p className="text-xs text-muted-foreground pl-1">Enter your credentials when prompted.</p>
        </div>

        {/* Step 3: Prepare */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">3</div>
            <FolderOpen className="w-4 h-4 text-amber-400" />
            Prepare your Skill
          </div>
          <p className="text-xs text-muted-foreground pl-1">
            Make sure your Skill directory contains a <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground/80">SKILL.md</code> file with frontmatter:
          </p>
          <pre className="rounded-xl border border-border/40 bg-black/40 p-4 text-xs font-mono text-foreground/90 overflow-auto whitespace-pre-wrap">{`---
name: my-skill
version: 1.0.0
description: What your skill does
---

# My Skill

Instructions for the AI agent...`}</pre>
          <p className="text-xs text-muted-foreground pl-1">
            <span className="text-foreground/70">Tip:</span> Use <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground/80">skild init my-skill</code> to quickly create a template.
          </p>
        </div>

        {/* Step 4: Publish */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">4</div>
            <Rocket className="w-4 h-4 text-emerald-400" />
            Publish
          </div>
          <p className="text-xs text-muted-foreground pl-1">Navigate to your Skill directory and run:</p>
          <pre className="rounded-xl border border-border/40 bg-black/40 p-4 text-xs font-mono text-foreground/90 overflow-auto">skild publish</pre>
          <p className="text-xs text-muted-foreground pl-1">
            That's it! 🎉 The CLI reads your <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground/80">SKILL.md</code> and publishes to <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground/80">@yourhandle/my-skill</code>.
          </p>
        </div>

        {/* Step 5: Install */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">5</div>
            <Download className="w-4 h-4 text-cyan-400" />
            Test your published Skill
          </div>
          <pre className="rounded-xl border border-border/40 bg-black/40 p-4 text-xs font-mono text-foreground/90 overflow-auto">skild install @yourhandle/my-skill</pre>
        </div>

        {/* Advanced Options */}
        <div className="border-t border-border/20 pt-6">
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Advanced options
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-3 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border/40 bg-muted/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="px-4 py-2 font-medium text-foreground/80">Use case</th>
                      <th className="px-4 py-2 font-medium text-foreground/80">Command</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/20">
                      <td className="px-4 py-2">Publish from a different directory</td>
                      <td className="px-4 py-2 font-mono text-foreground/80">skild publish --dir ./path/to/skill</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="px-4 py-2">Override name</td>
                      <td className="px-4 py-2 font-mono text-foreground/80">skild publish --name my-new-name</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="px-4 py-2">Override version</td>
                      <td className="px-4 py-2 font-mono text-foreground/80">skild publish --skill-version 2.0.0</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="px-4 py-2">Publish to beta tag</td>
                      <td className="px-4 py-2 font-mono text-foreground/80">skild publish --tag beta</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
