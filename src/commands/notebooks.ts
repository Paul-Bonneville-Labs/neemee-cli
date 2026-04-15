import { Command } from 'commander';
import { api } from '../api.js';

export function notebooksCommand(): Command {
  const notebooks = new Command('notebooks').description('Manage notebooks');

  notebooks
    .command('list')
    .description('List notebooks')
    .option('-p, --page <n>', 'Page number', '1')
    .option('-l, --limit <n>', 'Results per page (max 100)', '20')
    .option('-s, --search <query>', 'Search by name or description')
    .action(async (opts) => {
      try {
        const params: Record<string, string> = { page: opts.page, limit: opts.limit };
        if (opts.search) params.search = opts.search;

        const { notebooks: list, pagination } = await api.notebooks.list(params);
        const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

        const header = opts.search
          ? `\nNotebooks matching "${opts.search}" (${pagination.total} total, page ${pagination.page}/${totalPages}):\n`
          : `\nNotebooks (${pagination.total} total, page ${pagination.page}/${totalPages}):\n`;
        console.log(header);

        for (const nb of list) {
          const count = nb._count?.notes ?? '?';
          console.log(`  ${nb.id}  ${nb.name} (${count} notes)`);
          if (nb.description) console.log(`    ${nb.description}`);
        }
        if (list.length === 0) console.log('  (no notebooks)');
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  notebooks
    .command('get <id>')
    .description('Get a single notebook by ID')
    .action(async (id: string) => {
      try {
        const nb = await api.notebooks.get(id);
        const count = nb._count?.notes ?? '?';
        console.log(`\nName: ${nb.name} (${count} notes)`);
        if (nb.description) console.log(`Description: ${nb.description}`);
        console.log(`ID: ${nb.id}`);
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  notebooks
    .command('create')
    .description('Create a new notebook')
    .requiredOption('-n, --name <name>', 'Notebook name')
    .option('-d, --description <desc>', 'Description')
    .action(async (opts) => {
      try {
        const nb = await api.notebooks.create({ name: opts.name, description: opts.description });
        console.log(`Created notebook: ${nb.id} — ${nb.name}`);
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  notebooks
    .command('update <id>')
    .description('Update a notebook (name and/or description)')
    .option('-n, --name <name>', 'New name')
    .option('-d, --description <desc>', 'New description')
    .action(async (id: string, opts) => {
      try {
        if (opts.name === undefined && opts.description === undefined) {
          console.error('Error: provide at least --name or --description');
          process.exit(1);
        }
        const body: { name?: string; description?: string } = {};
        if (opts.name !== undefined) body.name = opts.name;
        if (opts.description !== undefined) body.description = opts.description;

        const nb = await api.notebooks.update(id, body);
        console.log(`Updated notebook: ${nb.id} — ${nb.name}`);
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  notebooks
    .command('delete <id>')
    .description('Delete a notebook')
    .action(async (id: string) => {
      try {
        await api.notebooks.delete(id);
        console.log(`Deleted notebook ${id}`);
      } catch (e) {
        console.error('Error:', (e as Error).message);
        process.exit(1);
      }
    });

  return notebooks;
}
