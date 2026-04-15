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
    .command('delete <id>')
    .description('Delete a note')
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
