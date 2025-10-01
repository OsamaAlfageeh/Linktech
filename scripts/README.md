# Blog Data Migration Scripts

This directory contains scripts to migrate blog data between databases in the simplest way possible.

## Quick Start

### Option 1: Simple Migration (Recommended)
```bash
npm run migrate-blog-data
```
This will guide you through the process interactively.

### Option 2: Step by Step
```bash
# 1. Export data from current database
npm run export-blog-data

# 2. Import data to live database
npm run import-blog-data exports/blog-export-YYYY-MM-DD.json
```

## What Gets Migrated

- ✅ **Blog Categories** - All categories with their metadata
- ✅ **Blog Posts** - All posts with content, metadata, and SEO data
- ✅ **Blog Comments** - All comments with author information
- ✅ **Authors** - User accounts that authored posts
- ✅ **Relationships** - All foreign key relationships are preserved

## Safety Features

- 🔍 **Dry Run Mode** - Test the migration without making changes
- ⏭️ **Skip Existing** - Won't overwrite existing data by default
- 🔄 **Update Existing** - Option to update existing records
- 📊 **Detailed Logging** - See exactly what's happening
- ✅ **Validation** - Checks for data integrity

## Usage Examples

### Interactive Migration
```bash
npm run migrate-blog-data
```

### Dry Run (Test Only)
```bash
npm run migrate-blog-data --dry-run
```

### Update Existing Records
```bash
npm run migrate-blog-data --update-existing
```

### Manual Export/Import
```bash
# Export from current database
npm run export-blog-data

# Import to live database
npm run import-blog-data exports/blog-export-2024-01-15.json

# Import with options
npm run import-blog-data exports/blog-export-2024-01-15.json --dry-run
npm run import-blog-data exports/blog-export-2024-01-15.json --update-existing
```

## Environment Setup

Make sure your environment variables are set correctly:

```bash
# For current database (source)
DATABASE_URL=your_current_database_url

# For live database (target) - update this before importing
DATABASE_URL=your_live_database_url
```

## File Structure

```
scripts/
├── export-blog-data.ts    # Export blog data to JSON
├── import-blog-data.ts    # Import blog data from JSON
├── migrate-blog-data.ts   # Complete migration tool
└── README.md             # This file

exports/                  # Created automatically
└── blog-export-YYYY-MM-DD.json
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` environment variable
   - Ensure the database is accessible

2. **Permission Errors**
   - Make sure you have write permissions to the `exports/` directory
   - Check database user permissions

3. **Duplicate Data**
   - Use `--dry-run` first to see what will happen
   - Use `--update-existing` to update instead of skip

4. **Missing Authors**
   - The script will create author accounts if they don't exist
   - Default password is "migrated-user" (should be changed)

### Getting Help

```bash
npm run migrate-blog-data --help
```

## Data Integrity

The migration scripts ensure:
- All foreign key relationships are preserved
- Author accounts are created if missing
- Categories are linked correctly
- Comments are associated with the right posts
- SEO metadata is preserved
- Publication dates and status are maintained

## Rollback

If something goes wrong:
1. The export file is preserved in `exports/`
2. You can re-run the import with different options
3. Use `--dry-run` to test changes
4. Database backups are recommended before migration
