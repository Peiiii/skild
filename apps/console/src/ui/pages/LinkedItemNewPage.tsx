import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createLinkedItem, parseLinkedItemUrl } from '@/lib/api';
import type { LinkedItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LinkedItemNewPage(): JSX.Element {
  const navigate = useNavigate();

  const [url, setUrl] = React.useState('');
  const [parsedSource, setParsedSource] = React.useState<LinkedItem['source'] | null>(null);
  const [defaults, setDefaults] = React.useState<{ title: string; description: string } | null>(null);
  const [install, setInstall] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [license, setLicense] = React.useState('');

  const [parseBusy, setParseBusy] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onParse(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setParseError(null);
    setParseBusy(true);
    try {
      const res = await parseLinkedItemUrl(url.trim());
      if (!res.ok) {
        setParseError(res.error);
        setParsedSource(null);
        setDefaults(null);
        setInstall(null);
        return;
      }
      setParsedSource(res.source);
      setDefaults(res.defaults);
      setInstall(res.install);
    } catch (err: unknown) {
      if (err instanceof HttpError) setParseError(err.bodyText || `HTTP ${err.status}`);
      else setParseError(err instanceof Error ? err.message : String(err));
    } finally {
      setParseBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    if (!parsedSource) {
      setError('Please parse a GitHub URL first.');
      return;
    }
    setBusy(true);
    try {
      const tagsArr = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await createLinkedItem({
        source: { ...parsedSource, provider: 'github' },
        title: title.trim() || null,
        description: description.trim() || null,
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
        <CardDescription>Add a skill from GitHub to the catalog.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="font-medium text-foreground/80">Accepted formats</div>
          <div className="mt-2 space-y-1 font-mono break-all">
            <div>https://github.com/owner/repo</div>
            <div>https://github.com/owner/repo/tree/main</div>
            <div>https://github.com/owner/repo/tree/main/path/to/skill</div>
            <div>https://github.com/owner/repo/tree/v1.0.0/path/to/skill</div>
          </div>
          <div className="mt-2">
            Tip: Path should point to the folder that contains <span className="font-mono">SKILL.md</span>.
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Submit failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form className="grid gap-4" onSubmit={onParse}>
          <div className="grid gap-2">
            <Label htmlFor="url">Step 1: Paste GitHub URL</Label>
            <Input
              id="url"
              value={url}
              onChange={e => setUrl(e.currentTarget.value)}
              placeholder="https://github.com/owner/repo/tree/main/path/to/skill"
              required
            />
          </div>
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={parseBusy || !url.trim()}>
              {parseBusy ? 'Parsing…' : 'Parse →'}
            </Button>
          </div>
        </form>

        {parseError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Parse failed</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {parsedSource && (
          <div className="mt-6 rounded-md border border-border/60 p-3 text-xs">
            <div className="font-medium text-foreground/80">✓ Parsed</div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div>Repo: <span className="font-mono">{parsedSource.repo}</span></div>
              <div>Path: <span className="font-mono">{parsedSource.path || '(root)'}</span></div>
              <div>Ref: <span className="font-mono">{parsedSource.ref || '(default)'}</span></div>
            </div>
          </div>
        )}

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <div className="text-sm font-medium">Step 2: Add Details (all optional)</div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.currentTarget.value)}
              placeholder={defaults?.title || 'Leave blank to use path name'}
              disabled={!parsedSource}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              value={description}
              onChange={e => setDescription(e.currentTarget.value)}
              placeholder={defaults?.description || 'Leave blank for "No description"'}
              disabled={!parsedSource}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={e => setTags(e.currentTarget.value)}
              placeholder="pdf, documents"
              disabled={!parsedSource}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={e => setCategory(e.currentTarget.value)}
              placeholder="documents"
              disabled={!parsedSource}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="license">License</Label>
            <Input
              id="license"
              value={license}
              onChange={e => setLicense(e.currentTarget.value)}
              placeholder="MIT / Apache-2.0 / Proprietary / unknown"
              disabled={!parsedSource}
            />
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs font-mono break-all">
            {install || 'Install command will appear after parsing.'}
          </div>

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={busy || !parsedSource}>
              {busy ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
