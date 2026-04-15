# neemee-cli

Command-line client for the [Neemee](https://neemee.app) notes API.

## Install

```bash
npm install -g neemee-cli
```

Requires Node.js 18+.

## Setup

Generate an API key at **neemee.app/settings → API Keys** (select `read` and/or `write` scopes). The CLI looks for a key in this order:

1. `NEEMEE_API_KEY` environment variable (recommended for shells/scripts/CI)
2. `~/.config/neemee/config.json` (set via `neemee config set-key`)

**Option 1 — environment variable** (add to `~/.zshrc` or `~/.bashrc`):

```bash
export NEEMEE_API_KEY="your-api-key-here"
# Optional: override base URL (default: https://neemee.app)
# export NEEMEE_BASE_URL="http://localhost:3100"
```

**Option 2 — config file**:

```bash
neemee config set-key <your-api-key>
```

Then verify:

```bash
neemee config whoami
```

## Commands

### Notes

```bash
neemee notes list [--search <q>] [--notebook <id>] [--limit 20] [--page 1]
neemee notes get <id>
neemee notes create --content "My note content" [--title "Title"] [--url <url>] [--notebook <id>]
neemee notes update <id> --content "Updated content" [--title "..."] [--url <...>] [--notebook <id|none>]
neemee notes delete <id>
```

> **Note:** `notes update` requires `--content` — the REST API treats `content` as mandatory on PUT even for a title-only edit.

### Notebooks

```bash
neemee notebooks list [--search <q>] [--limit 20] [--page 1]
neemee notebooks get <id>
neemee notebooks create --name "My notebook" [--description "..."]
neemee notebooks update <id> [--name "..."] [--description "..."]
neemee notebooks delete <id>
```

### Search

Shortcut for `notes list --search`:

```bash
neemee search "<query>"
```

Searches across content, note title, URL, source domain, notebook name, and frontmatter values. To search notebooks instead, use `neemee notebooks list --search "<query>"`.

### Frontmatter format guide

```bash
neemee frontmatter-guide [--type basic|research|task|article]
```

Prints a reference guide with examples for the YAML frontmatter format Neemee uses on notes.

### Configuration

```bash
neemee config set-key <key>    # Store your API key
neemee config set-url <url>    # Override base URL (default: https://neemee.app)
neemee config show             # Show current config (key masked)
neemee config whoami           # Verify key and show user info
```

Config is stored at `~/.config/neemee/config.json`.

## Scopes

API keys have one or more scopes that control access:

| Scope  | Access                                                    |
| ------ | --------------------------------------------------------- |
| `read` | GET endpoints only                                        |
| `write`| POST, PUT, DELETE + all `read` operations                 |
| `admin`| All operations (future use)                               |

## Development

```bash
npm install
npm run build
node dist/index.js --help
```

For local development against a Neemee instance running on a non-default port:

```bash
neemee config set-url http://localhost:3100
```

## API Reference

Full REST API documentation: [neemee-frontend/docs/api/REST_API.md](https://github.com/Paul-Bonneville-Labs/neemee-frontend/blob/main/docs/api/REST_API.md)

## License

MIT
