#!/usr/bin/env node
import { Command } from 'commander';
import { notesCommand } from './commands/notes.js';
import { notebooksCommand } from './commands/notebooks.js';
import { frontmatterGuideCommand } from './commands/frontmatter.js';
import { writeConfig, readConfig, getBaseUrl, getApiKeySource } from './config.js';
import { api } from './api.js';

const program = new Command();

program
  .name('neemee')
  .description('CLI for Neemee notes')
  .version('0.3.2')
  .addHelpText('after', `
Getting started:
  1. Generate an API key at https://neemee.app/settings -> API Keys
  2. Export it:               export NEEMEE_API_KEY="..."       (recommended: add to ~/.zshrc)
                              or:  neemee config set-key <key>
  3. Verify:                  neemee config whoami

Common workflows:
  Save a quick note           neemee notes create -c "quick thought" -t "Idea"
  Find something              neemee search "<query>"
                              neemee notes list --search "<query>" --limit 50
  Browse notebooks            neemee notebooks list
  Organize a note             neemee notes update <noteId> -c "<content>" -n <notebookId>
  Email a note                neemee notes email <noteId> --to you@example.com
  View full note              neemee notes get <noteId>
  Frontmatter reference       neemee frontmatter-guide --type basic

Tips:
  * Every command has its own --help with examples (e.g. 'neemee notes update --help')
  * Env vars override config: NEEMEE_API_KEY, NEEMEE_BASE_URL
  * Scopes on your API key control what you can do (read for GET, write for POST/PUT/DELETE)

Docs:
  README        https://github.com/Paul-Bonneville-Labs/neemee-cli#readme
  REST API      https://github.com/Paul-Bonneville-Labs/neemee-frontend/blob/main/docs/api/REST_API.md
`);

// Config commands
const config = new Command('config').description('Manage CLI configuration');

config
  .command('set-key <key>')
  .description('Store your Neemee API key in ~/.config/neemee/config.json')
  .addHelpText('after', `
Example:
  $ neemee config set-key 8d22e28a1067df800b6e93ce0de22be714efaf61b171e965b2a4b1377dfcc331

Tip: For most users, setting NEEMEE_API_KEY in ~/.zshrc is simpler and works better
     across shells, scripts, and CI. The env var takes precedence over this file.
`)
    .action((key: string) => {
    writeConfig({ apiKey: key });
    console.log('API key saved to ~/.config/neemee/config.json');
  });

config
  .command('set-url <url>')
  .description('Set base URL (default: https://neemee.app)')
  .addHelpText('after', `
Examples:
  $ neemee config set-url https://neemee.app          # production (default)
  $ neemee config set-url http://localhost:3100       # local dev server
`)
    .action((url: string) => {
    writeConfig({ baseUrl: url });
    console.log(`Base URL set to ${url}`);
  });

config
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const source = getApiKeySource();
    const envKey = process.env.NEEMEE_API_KEY?.trim();
    const cfgKey = readConfig().apiKey;
    const activeKey = envKey ?? cfgKey;
    const preview = activeKey ? `${activeKey.substring(0, 8)}...` : '(not set)';
    const sourceLabel = source === 'env' ? ' (from NEEMEE_API_KEY)' : source === 'config' ? ' (from config file)' : '';
    console.log(`API Key: ${preview}${sourceLabel}`);
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
program.addCommand(frontmatterGuideCommand());

program
  .command('search <query>')
  .description('Search notes across content, title, URL, domain, notebook, and frontmatter')
  .option('-l, --limit <n>', 'Results per page (max 100)', '20')
  .option('-p, --page <n>', 'Page number', '1')
  .addHelpText('after', `
Examples:
  $ neemee search "react"
  $ neemee search "quarterly review" --limit 50
  $ neemee search "carbon capture" --page 2

This is a shortcut for 'neemee notes list --search <query>'.
To search notebooks instead, use: neemee notebooks list --search "<query>"
`)
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
