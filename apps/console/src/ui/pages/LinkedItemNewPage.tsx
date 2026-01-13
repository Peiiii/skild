import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createLinkedItem } from '@/lib/api';
import { HttpError } from '@/lib/http';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LinkedItemNewPage(): JSX.Element {
  const navigate = useNavigate();

  const [repo, setRepo] = React.useState('');
  const [path, setPath] = React.useState('');
  const [ref, setRef] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [license, setLicense] = React.useState('');

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tagsArr = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await createLinkedItem({
        source: { provider: 'github', repo: repo.trim(), path: path.trim() || null, ref: ref.trim() || null },
        title: title.trim(),
        description: description.trim(),
        license: license.trim() || null,
        category: category.trim() || null,
        tags: tagsArr
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      navigate(`/linked/${res.item.id}`, { replace: true });
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit GitHub skill</CardTitle>
        <CardDescription>Create an index-only catalog item. Users will install directly from GitHub.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="font-medium text-foreground/80">Examples</div>
          <div className="mt-2 grid gap-2">
            <div>
              <span className="font-medium">Repo</span>: <span className="font-mono">anthropics/skills</span> ·{' '}
              <span className="font-medium">Path</span>: <span className="font-mono">skills/pdf</span> ·{' '}
              <span className="font-medium">Ref</span>: <span className="font-mono">main</span>
              <div className="mt-1">
                GitHub URL:{' '}
                <span className="font-mono break-all">https://github.com/anthropics/skills/tree/main/skills/pdf</span>
              </div>
            </div>
            <div>
              <span className="font-medium">Repo</span>: <span className="font-mono">owner/repo</span> ·{' '}
              <span className="font-medium">Path</span>: <span className="font-mono">(empty)</span> ·{' '}
              <span className="font-medium">Ref</span>: <span className="font-mono">v1.2.3</span>
              <div className="mt-1">
                GitHub URL:{' '}
                <span className="font-mono break-all">https://github.com/owner/repo/tree/v1.2.3</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            Tip: <span className="font-mono">Path</span> is the folder that contains <span className="font-mono">SKILL.md</span>.
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Submit failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="repo">Repo</Label>
            <Input id="repo" value={repo} onChange={e => setRepo(e.currentTarget.value)} placeholder="owner/repo" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="path">Path (optional)</Label>
            <Input id="path" value={path} onChange={e => setPath(e.currentTarget.value)} placeholder="skills/pdf" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ref">Ref (optional)</Label>
            <Input id="ref" value={ref} onChange={e => setRef(e.currentTarget.value)} placeholder="main / v1.0.0 / <sha>" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.currentTarget.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={description} onChange={e => setDescription(e.currentTarget.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={e => setTags(e.currentTarget.value)} placeholder="pdf, documents" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input id="category" value={category} onChange={e => setCategory(e.currentTarget.value)} placeholder="documents" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="license">License (optional)</Label>
            <Input id="license" value={license} onChange={e => setLicense(e.currentTarget.value)} placeholder="MIT / Apache-2.0 / Proprietary / unknown" />
          </div>

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
