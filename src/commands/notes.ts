import { Command } from 'commander';
import { api } from '../api.js';

export function notesCommand(): Command {
  const notes = new Command('notes').description('Manage notes');

  notes
    .command('list')
    .description('List notes')
    .option('-p, --page <n>', 'Page number', '1')
    .option('-l, --limit <n>', 'Results per page (max 100)', '20')
    .option('-s, --search <query>', 'Search query')
    .option('-n, --notebook <id>', 'Filter by notebook ID')
    .addHelpText('after', `
Examples:
  $ neemee notes list
  $ neemee notes list --limit 50
  $ neemee notes list --search "typescript"
  $ neemee notes list --notebook cmeloc622000116fs5ap6yngs --limit 100
`)
    .action(async (opts) => {
      try {
        const params: Record<string, string> = { page: opts.page, limit: opts.limit };
        if (opts.search) params.search = opts.search;
        if (opts.notebook) params.notebookId = opts.notebook;

        const result = await api.notes.list(params);
        const { notes, pagination } = result;
        const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

        console.log(`\nNotes (${pagination.total} total, page ${pagination.page}/${totalPages}):\n`);
        for (const note of notes) {
          const nb = note.notebook ? ` [${note.notebook.name}]` : '';
          console.log(`  ${note.id}  ${note.noteTitle}${nb}`);
          console.log(`    ${new Date(note.createdAt).toLocaleDateString()}`);
        }
        if (notes.length === 0) console.log('  (no notes)');
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  notes
    .command('get <id>')
    .description('Get a single note by ID')
    .addHelpText('after', `
Example:
  $ neemee notes get cmnxze6rj000vore865b2hbed
`)
    .action(async (id: string) => {
      try {
        const note = await api.notes.get(id);
        console.log(`\nTitle: ${note.noteTitle}`);
        if (note.pageUrl) console.log(`URL:   ${note.pageUrl}`);
        console.log(`\n${note.content}\n`);
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  notes
    .command('create')
    .description('Create a new note')
    .requiredOption('-c, --content <text>', 'Note content (markdown)')
    .option('-t, --title <title>', 'Note title')
    .option('-u, --url <url>', 'Source URL')
    .option('-n, --notebook <id>', 'Notebook ID')
    .addHelpText('after', `
Examples:
  $ neemee notes create -c "Quick thought" -t "Random idea"
  $ neemee notes create -c "$(cat mynote.md)" -t "Imported note"
  $ neemee notes create -c "API-related research" -t "API notes" -n cmeloc622000116fs5ap6yngs
  $ neemee notes create -c "See link" -t "Article" -u "https://example.com/article"
`)
    .action(async (opts) => {
      try {
        const note = await api.notes.create({
          content: opts.content,
          noteTitle: opts.title,
          pageUrl: opts.url,
          notebookId: opts.notebook,
        });
        console.log(`Created note: ${note.id} — ${note.noteTitle}`);
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  notes
    .command('update <id>')
    .description('Update a note (content is required by the API, even for a title-only change)')
    .requiredOption('-c, --content <text>', 'New note content (markdown) — required')
    .option('-t, --title <title>', 'New note title')
    .option('-u, --url <url>', 'New source URL')
    .option('-n, --notebook <id>', 'Move to this notebook (use "none" to detach)')
    .addHelpText('after', `
Examples:
  $ neemee notes update cmnxze6rj000vore865b2hbed -c "revised content" -t "New title"
  $ neemee notes update cmnxze6rj000vore865b2hbed -c "$(cat updated.md)"
  $ neemee notes update cmnxze6rj000vore865b2hbed -c "same content" -n cmeloc622000116fs5ap6yngs
  $ neemee notes update cmnxze6rj000vore865b2hbed -c "same content" -n none   # detach from notebook

Note: The REST API treats 'content' as mandatory on PUT even for a title-only edit.
      Pass the current content if you only want to change other fields.
`)
    .action(async (id: string, opts) => {
      try {
        const body: { content: string; noteTitle?: string; pageUrl?: string; notebookId?: string | null } = {
          content: opts.content,
        };
        if (opts.title !== undefined) body.noteTitle = opts.title;
        if (opts.url !== undefined) body.pageUrl = opts.url;
        if (opts.notebook !== undefined) body.notebookId = opts.notebook === 'none' ? null : opts.notebook;

        const note = await api.notes.update(id, body);
        console.log(`Updated note: ${note.id} — ${note.noteTitle}`);
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  notes
    .command('delete <id>')
    .description('Delete a note')
    .addHelpText('after', `
Example:
  $ neemee notes delete cmnxze6rj000vore865b2hbed
`)
    .action(async (id: string) => {
      try {
        await api.notes.delete(id);
        console.log(`Deleted note ${id}`);
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  return notes;
}
