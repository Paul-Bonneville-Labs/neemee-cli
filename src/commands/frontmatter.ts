import { Command } from 'commander';

type ExampleType = 'basic' | 'research' | 'task' | 'article';

const examples: Record<ExampleType, { description: string; frontmatter: Record<string, unknown> }> = {
  basic: {
    description: 'Basic frontmatter with common fields',
    frontmatter: {
      tags: ['example', 'basic'],
      priority: 'medium',
      created_by: 'ai_assistant',
      reading_time: 2,
    },
  },
  research: {
    description: 'Research note with academic metadata',
    frontmatter: {
      tags: ['research', 'climate', 'sustainability'],
      source: 'Nature Climate Change',
      authors: ['Smith, J.', 'Doe, A.'],
      publication_year: 2024,
      doi: '10.1038/example',
      methodology: 'systematic_review',
      confidence_level: 'high',
      related_topics: ['carbon_capture', 'renewable_energy'],
    },
  },
  task: {
    description: 'Task-oriented note with workflow metadata',
    frontmatter: {
      tags: ['task', 'todo'],
      status: 'in_progress',
      priority: 'high',
      due_date: '2024-01-15',
      assigned_to: 'team_lead',
      estimated_hours: 4,
      completed: false,
      dependencies: ['task_001', 'task_002'],
    },
  },
  article: {
    description: 'Article/blog post with publication metadata',
    frontmatter: {
      tags: ['article', 'climate_tech'],
      title: 'The Future of Carbon Capture',
      author: 'Climate Researcher',
      published_date: '2024-01-10',
      reading_time: 8,
      difficulty: 'intermediate',
      keywords: ['carbon', 'technology', 'climate'],
      summary: 'Overview of emerging carbon capture technologies',
    },
  },
};

export function frontmatterGuideCommand(): Command {
  return new Command('frontmatter-guide')
    .description('Show the Neemee frontmatter format guide with examples')
    .option('-t, --type <type>', 'Example type: basic, research, task, article', 'basic')
    .action((opts) => {
      const type = opts.type as ExampleType;
      if (!(type in examples)) {
        console.error(`Error: unknown type "${type}". Use: basic, research, task, article`);
        process.exit(1);
      }
      const example = examples[type];

      console.log(`# Neemee Frontmatter Format Guide

## ${example.description}

**Correct Format (YAML-compatible JSON):**
\`\`\`json
${JSON.stringify(example.frontmatter, null, 2)}
\`\`\`

## Supported Data Types

✅ Strings:   "text value" or "2024-01-15"
✅ Numbers:   42 or 3.14
✅ Booleans:  true or false
✅ Arrays:    ["item1", "item2"]
✅ Objects:   { "key": "value", "count": 5 }

❌ Avoid deep nesting — may not display correctly
❌ Avoid functions/classes — JSON-serializable data only

## Common Field Patterns

- Tags:     always arrays of strings:  ["tag1", "tag2"]
- Dates:    ISO strings:                "2024-01-15" or "2024-01-15T10:30:00Z"
- Status:   "todo" | "in_progress" | "completed"
- Priority: "low" | "medium" | "high" | "urgent"
- Numbers:  plain numbers for counts, scores, reading time

## Why This Format

Neemee uses YAML frontmatter (like Jekyll, Hugo, Obsidian) for:
- Human-readable metadata
- Portable markdown files
- Flexible schema without database migrations
- Compatibility with static site generators

The Neemee UI auto-detects field types and renders the appropriate controls.

## Other Example Types

Run with --type to see alternate examples:
  neemee frontmatter-guide --type research
  neemee frontmatter-guide --type task
  neemee frontmatter-guide --type article
`);
    });
}
