# eleventy-character-directory
Eleventy starter for generating a Toyhouse-like static website with the goal of creating a (mostly) drag-and-drop experience for maintaining character galleries and folder organization.

## Features:

- ### Config File
    - JSON Config file to make managing settings like default character layout, OCs per directory page, and character name badge display much more straightforward
    - customizable categorization paths (/oc/, /stories/, /world/, & /tagged/, all can be changed)

- ### Two Layout Variants
    - A Single-page layout with all sections rendered on one page
    - A Multi-Page Layout with a base overview page and subpages for relationships and gallery data
    - Default Layout is set globally in the config but can be overridden on a per-character basis

- ### Folder View and Automatic 'Folder' Generation
    - Recursively scans the directory specified by the config (default: Characters), automatically constructing a hierarchy of folders and characters that are then displayed on the site.
    - Folders can contain both characters and subfolders, with the leaves being considered character containers as long as they contain at least 1 markdown file with **layout: character.njk** in the frontmatter
    - Automatically discovers folder icons and markdown folder descriptions
    - You can leave all character containers directly inside the base directory to disable the folders feature entirely.

- ### Flat Directory View
    - Generates multiple paginated views of all non-hidden characters, allowing you to browse all characters in differing orders:
        - by ID (Ascending)
        - by Created (Newest)
        - by Updated (Recent)

- ### Complex Character Management
    - Create container directories that contain a markdown file for the character's profile information and all associated image files.
    - Characters must have unique IDs and can be given custom page slugs
    - Characters can be hidden from the directory pages on a per-character basis.
    - Frontmatter is validated in processing so invalid markdown files don't generate junk pages, character IDs/page URLs never collide, and invalid relationships with non-existent characters are caught
    - Placeholder icon is used when no icon file is specified (replace icon.png in /public/images/characters/p/ for a custom placeholder)
    - Custom css files can be added to /public/css and then called in the character frontmatter to customize page layout on a per-character basis

- ### Image and Gallery processing
    - Finds character images, assigns metadata to those images by reading a gallery.yaml, assigns icon and portrait URLs
    - Images for folders and characters are queued for copying into the output public assets directory.
    - Character image files are placed into folders inside /public/images/characters/ that are associated with their unique ID number to prevent collisions.
    - Image files have their filenames automatically slugified.

- ### Relationships
    - Simple one-sided friends and enemies lists.
    - More complex connection pairs that function like Toyhouse links.

- ### Worlds, Tags, and Stories
    - Groups characters by tags and worlds, automatically creating a tag or a world entry when it exists in at least 1 character's frontmatter. the first character encountered determines the tag/world's title case
    - However, Worlds can be given more complex metadata by creating a matching world markdown file:
        - control title case with frontmatter
        - add created/updated dates
        - add a custom description to the world's page 
    - Generates paginated directory, world, and tag data pages
    - Associates stories with characters, linking directly to the featured characters.
