#!/usr/bin/env node
import { Command } from 'commander';
import { notesCommand } from './commands/notes.js';
import { notebooksCommand } from './commands/notebooks.js';
import { writeConfig, readConfig, getBaseUrl } from './config.js';
import { api } from './api.js';

const program = new Command();

program
  .name('neemee')
  .description('CLI for Neemee notes')
  .version('0.1.0');

// Config commands
const config = new Command('config').description('Manage CLI configuration');

config
  .command('set-key <key>')
  .description('Store your Neemee API key')
  .action((key: string) => {
    writeConfig({ apiKey: key });
    console.log('API key saved to ~/.config/neemee/config.json');
  });

config
  .command('set-url <url>')
  .description('Set base URL (default: https://neemee.app)')
  .action((url: string) => {
    writeConfig({ baseUrl: url });
    console.log(`Base URL set to ${url}`);
  });

config
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const cfg = readConfig();
    console.log(`API Key: ${cfg.apiKey ? `${cfg.apiKey.substring(0, 8)}...` : '(not set)'}`);
    console.log(`Base URL: ${getBaseUrl()}`);
  });

config
  .command('whoami')
  .description('Verify your API key and show your user info')
  .action(async () => {
    try {
      const user = await api.user.me();
      console.log(`Authenticated as: ${user.name ?? user.email} (${user.id})`);
    } catch (e) {
      console.error('Error:', (e as Error).message);
      process.exit(1);
    }
  });

program.addCommand(config);
program.addCommand(notesCommand());
program.addCommand(notebooksCommand());

program
  .command('search <query>')
  .description('Search notes across content, title, URL, domain, notebook, and frontmatter')
  .option('-l, --limit <n>', 'Results per page (max 100)', '20')
  .option('-p, --page <n>', 'Page number', '1')
  .action(async (query: string, opts) => {
    try {
      const result = await api.notes.list({ search: query, limit: opts.limit, page: opts.page });
      const { notes, pagination } = result;
      const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

      console.log(`\nFound ${pagination.total} note${pagination.total === 1 ? '' : 's'} matching "${query}" (page ${pagination.page}/${totalPages}):\n`);
      for (const note of notes) {
        const nb = note.notebook ? ` [${note.notebook.name}]` : '';
        console.log(`  ${note.id}  ${note.noteTitle}${nb}`);
        console.log(`    ${new Date(note.createdAt).toLocaleDateString()}`);
      }
      if (notes.length === 0) console.log('  (no matches)');
    } catch (e) {
      console.error('Error:', (e as Error).message);
      process.exit(1);
    }
  });

program.parse();
