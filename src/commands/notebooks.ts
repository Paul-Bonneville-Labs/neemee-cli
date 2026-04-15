import { Command } from 'commander';
import { api } from '../api.js';

export function notebooksCommand(): Command {
  const notebooks = new Command('notebooks').description('Manage notebooks');

  notebooks
    .command('list')
    .description('List all notebooks')
    .action(async () => {
      try {
        const { notebooks: list } = await api.notebooks.list();
        console.log('\nNotebooks:\n');
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
