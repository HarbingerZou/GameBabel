# Progress File Generation Instructions

Guidelines for creating daily progress summaries.

## Extracting Commits

### Main Repository
```bash
git log --since="24 hours ago" --all --stat --pretty=format:"%h - %s%nDate: %ad%n"
```

### Submodules
Run the same command inside each submodule directory:
- `ds-services/`
- `data-persistence/`
- `crawler/`
- `image-ocr/`

## Progress File Structure

1. **Summary** - One-liner of what was accomplished
2. **Features Completed** - Group commits into logical features
3. **Commits Table** - List all commits by repository
4. **Data Flow** - If architecture changed, show the new flow
5. **Impact** - Before/after comparison
6. **Technical Debt** - Note any shortcuts or items to revisit

## Guidelines

- Group related commits into features rather than listing individually
- Focus on what was accomplished, not just what changed
- Include code flow diagrams when the pipeline changes
- Note any breaking changes or migration needs
- Keep technical debt list actionable

## File Naming

`[YYYY-MM-DD]-progress.md`
