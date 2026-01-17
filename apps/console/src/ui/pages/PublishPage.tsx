import * as React from 'react';
import { UserPlus, LogIn, FolderOpen, Rocket, Download, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';
import { Badge } from '@/components/ui/badge';

export function PublishPage(): JSX.Element {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <Card>
      <CardHeader className="pb-8">
        <CardTitle className="text-4xl font-serif">Publish your Skill</CardTitle>
        <CardDescription className="text-lg text-brand-forest/60 font-medium italic">Share your Skill with the community in just a few steps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 text-sm">
        {/* Step 1: Signup */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-forest text-white flex items-center justify-center font-serif font-bold shadow-lg shadow-brand-forest/10">1</div>
            <div className="flex items-center gap-2 font-serif font-bold text-xl text-brand-forest">
              <UserPlus className="w-5 h-5" />
              Sign up (first time only)
            </div>
          </div>
          <CodeBlock copyValue="skild signup">
            skild signup
          </CodeBlock>
          <p className="text-sm text-brand-forest/60 font-medium px-1">Follow the prompts to enter your email, handle, and password.</p>
        </div>

        {/* Step 2: Login */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-forest text-white flex items-center justify-center font-serif font-bold shadow-lg shadow-brand-forest/10">2</div>
            <div className="flex items-center gap-2 font-serif font-bold text-xl text-brand-forest">
              <LogIn className="w-5 h-5" />
              Login
            </div>
          </div>
          <CodeBlock copyValue="skild login">
            skild login
          </CodeBlock>
          <p className="text-sm text-brand-forest/60 font-medium px-1">Enter your credentials when prompted.</p>
        </div>

        {/* Step 3: Prepare */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-forest text-white flex items-center justify-center font-serif font-bold shadow-lg shadow-brand-forest/10">3</div>
            <div className="flex items-center gap-2 font-serif font-bold text-xl text-brand-forest">
              <FolderOpen className="w-5 h-5" />
              Prepare your Skill
            </div>
          </div>
          <p className="text-sm text-brand-forest/60 font-medium px-1">
            Make sure your Skill directory contains a <code className="bg-brand-forest/5 px-2 py-0.5 rounded-full text-brand-forest font-bold font-mono">SKILL.md</code> file with frontmatter:
          </p>
          <CodeBlock>
            {`---
name: my-skill
version: 1.0.0
description: What your skill does
---

# My Skill

Instructions for the AI agent...`}
          </CodeBlock>
          <p className="text-sm text-brand-forest/60 font-medium px-1">
            <span className="text-brand-forest font-bold">Tip:</span> Use <code className="bg-brand-forest/5 px-2 py-0.5 rounded-full text-brand-forest font-bold font-mono">skild init my-skill</code> to quickly create a template.
          </p>
        </div>

        {/* Step 4: Publish */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-forest text-white flex items-center justify-center font-serif font-bold shadow-lg shadow-brand-forest/10">4</div>
            <div className="flex items-center gap-2 font-serif font-bold text-xl text-brand-forest">
              <Rocket className="w-5 h-5" />
              Publish
            </div>
          </div>
          <p className="text-sm text-brand-forest/60 font-medium px-1">Navigate to your Skill directory and run:</p>
          <CodeBlock copyValue="skild publish">
            skild publish
          </CodeBlock>
          <p className="text-sm text-brand-forest/60 font-medium px-1">
            That's it! 🎉 The CLI reads your <code className="bg-brand-forest/5 px-2 py-0.5 rounded-full text-brand-forest font-bold font-mono">SKILL.md</code> and publishes to <code className="bg-brand-forest/5 px-2 py-0.5 rounded-full text-brand-forest font-bold font-mono">@yourhandle/my-skill</code>.
          </p>
        </div>

        {/* Step 5: Install */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-forest text-white flex items-center justify-center font-serif font-bold shadow-lg shadow-brand-forest/10">5</div>
            <div className="flex items-center gap-2 font-serif font-bold text-xl text-brand-forest">
              <Download className="w-5 h-5" />
              Test your published Skill
            </div>
          </div>
          <CodeBlock copyValue="skild install @yourhandle/my-skill">
            skild install @yourhandle/my-skill
          </CodeBlock>
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
