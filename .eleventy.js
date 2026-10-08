import path from "node:path";
import fs from "node:fs";
import markdownIt from "markdown-it";
import { getCharacterConfig } from "./src/_lib/character_config.js";
import { parse as parseYaml } from "yaml";

// needed to convert folder description md files into markdown usable on the pages
const md = markdownIt({
  html: true,
  breaks: true,
});

// MAIN
export default function (eleventyConfig) {
  // get character config
  const character_config = getCharacterConfig();
  // resolve character directory
  const charactersDir = path.resolve(process.cwd(), `src/${character_config.base_directory}`);
  // make sure it exists, if not end the process
  if (!fs.existsSync(charactersDir)) {
    throw new Error(`Characters directory not found (must match config): ${charactersDir}`);
  }

  // skip when building for now
  eleventyConfig.setUseGitIgnore(false);
  // watch for config file changes
  eleventyConfig.addWatchTarget("./src/_data/");

  // setup directory stuff
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_layouts");
  eleventyConfig.setOutputDirectory("output");
  eleventyConfig.setInputDirectory("src");

  // ignore folder descriptions & README files
  eleventyConfig.ignores.add(`src/worlds`);
  eleventyConfig.ignores.add(`src/${character_config.base_directory}/**/folder.md`);
  eleventyConfig.ignores.add(`src/${character_config.base_directory}/**/README.md`);

  // we will NOT be automatically pulling in static assets here
  // anything stored in the characters folder will be copied over programatically
  // put non-character assets like backgrounds or custom css files in the public folder...
  eleventyConfig.setTemplateFormats(["html", "njk", "md"]);
  // ...because that's being directly copied to our output
  eleventyConfig.addPassthroughCopy("public");
  

  // include slugifier access for our later functions
  const slugify = eleventyConfig.getFilter("slugify");

  // stuff for moving over folder & character images later
  const images_to_copy = [];
  const valid_image_types = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];

  function queue_image(source, destination) {
    images_to_copy.push({
      source,
      destination,
    });
  }
  // date filter
  eleventyConfig.addFilter("htmlDateString", dateObj => {
    const date = new Date(dateObj);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  });
  // limit filter
  eleventyConfig.addNunjucksFilter("limit", (arr, limit) =>
    arr.slice(0, limit),
  );

  // oc filters
  eleventyConfig.addFilter("featured", ocs => {
    return ocs
      .filter(oc => oc.data.show_in_directory === true)
      .filter(oc => oc.data.featured === true);
  });
  eleventyConfig.addFilter("created", ocs => {
    return ocs.filter(oc => oc.data.show_in_directory === true).sort((a, b) => b.data.created - a.data.created);
  });
  eleventyConfig.addFilter("updated", ocs => {
    return ocs.filter(oc => oc.data.show_in_directory === true).sort((a, b) => b.data.updated - a.data.updated);
  });
  eleventyConfig.addCollection("ocs", function (collection) {
    const ocs = validateCharacters(collection.getFilteredByTag("oc"));
    // if we're good we can get gallery for all ocs :)
    for (const oc of ocs) {
      oc.data.gallery = getGallery(oc);
      if (!oc.data.page_url) { oc.data.page_url = oc.data.id }
    }
    return ocs;
  });

  // character validation
  function validateCharacters(ocs) {
    const ids = new Map(),
      urls = new Map(),
      errors = [];

    // checking for duplicate IDs/URLs
    for (const oc of ocs) {
      let id = Number(oc.data.id),
        url = oc.url;

      // error for invalid IDs
      if (!Number.isInteger(id)) {
        errors.push(
          `OC ${oc.data.name} ID must be an integer in ${oc.inputPath}: "${oc.data.id}"`,
        );
      }
      if (!oc.data.created) {
        errors.push(
          `OC ${oc.data.name} missing created date ${oc.inputPath}: "${oc.data.created}"`,
        );
      }
      if (!oc.data.updated) {
        errors.push(
          `OC ${oc.data.name} missing updated date ${oc.inputPath}: "${oc.data.updated}"`,
        );
      }
      // error if we don't include show_in_directory
      if (typeof oc.data.show_in_directory != "boolean") {
        errors.push(
          `OC must have the show_in_directory field and it MUST be unquoted value as either true or false:\n\t\t${oc.inputPath}\n\t\tvalue: "${oc.data.show_in_directory}"`,
        );
      }
      // error for duplicate ids because the unique ids are important for connections/file renaming
      if (ids.has(id)) {
        const other = ids.get(id);
        errors.push(
          `Duplicate OC ID: ${id}\n` +
            `\t\t${other.inputPath}\n` +
            `\t\t${oc.inputPath}`,
        );
      } else {
        ids.set(id, oc);
      }
      // duplicate permalink
      if (urls.has(url)) {
        const other = urls.get(url);
        errors.push(
          `Duplicate OC URL: ${url}\n` +
            `\t\t${other.inputPath}\n` +
            `\t\t${oc.inputPath}`,
        );
      } else {
        urls.set(url);
      }
      // dates must be YYYY-MM-DD
      if (typeof oc.data.created != "object") {
        errors.push(
          `Invalid date for created date for #${oc.data.id}: ${oc.data.name}: value ${oc.data.created}, Expected YYYY-MM-DD.`
        );
      }
      if (typeof oc.data.updated != "object") {
        errors.push(
          `Invalid date for updated date for #${oc.data.id}: ${oc.data.name}. value ${oc.data.updated}, Expected YYYY-MM-DD.`
        );
      }
    }
    if (errors.length > 0) {
      console.error("OC validation failed!");
      throw new Error(`OC Errors:\n\t- ${errors.join("\n\t- ")}`);
    }
    return ocs;
  }

  // HELPER FUNCTIONS
  function is_image(filename) {
    return valid_image_types.includes(path.extname(filename).toLowerCase());
  }
  
  function findIcon(directory) {
    const entry = fs
      .readdirSync(directory, {
        withFileTypes: true,
      })
      .find(
        (entry) =>
          entry.isFile() &&
          path.basename(entry.name, path.extname(entry.name)).toLowerCase() ===
            "icon" &&
          is_image(entry.name),
      );
    return entry ? entry.name : null;
  }

  function getDescription(directory) {
    const descriptionFile = path.join(directory, "folder.md");
    if (!fs.existsSync(descriptionFile)) {
      return null;
    } else {
      const source = fs.readFileSync(descriptionFile, "utf8").trim();
      return {
        markdown: source,
        html: md.render(source),
      };
    }
  }

  function scanDirectory(directory, relativePath = "", ocs = []) {
    // storing slugified path urls for breadcrumbs
    const pathParts = [];
    let urlPath = "";
    const character_config = getCharacterConfig();

    if (relativePath !== "") {
      for (const part of relativePath.split("/")) {
        const slug = slugify(part);

        urlPath = urlPath ? `${urlPath}/${slug}` : slug;

        pathParts.push({
          name: part,
          slug,
          path: urlPath,
        });
      }
    }
    // read the contents
    const entries = fs.readdirSync(directory, {
      withFileTypes: true,
    });
    // see if there are any directories inside it
    const directories = entries.filter((entry) => entry.isDirectory());
    // empty dirs will be treated like empty folders
    const empty = entries.length === 0 ? true : false;

    // deepest directory in the tree = oc container
    // we exclude the root directory from this logic since characters are allowed to be unsorted
    if (relativePath !== "" && directories.length === 0 && !empty) {
      // find the oc markdown file
      const markdown = entries.filter(
        (entry) =>
          entry.isFile() && path.extname(entry.name).toLowerCase() === ".md",
      );
      const empty = entries.filter((entry) => entry.isFile());

      // ERROR CHECKING
      // do not allow multiple markdown files since 11ty will generate junk pages for md files that don't have permalink: false in their frontmatter
      if (markdown.length == 0 && !empty) {
        throw new Error(`No markdown files in the OC container: ${directory}`);
      } else if (markdown.length > 1 && !empty) {
        throw new Error(
          `Too many markdown files in the OC container: ${directory}`,
        );
      } else if (!empty) {
      }
      // validate it against the ocs collection
      const inputPath = path.resolve(directory, markdown[0].name);
      let oc = ocs.find((item) => path.resolve(item.inputPath) === inputPath);
      if (!oc) {
        throw new Error(
          `No OC found for: ${inputPath}. Make sure your frontmatter has layout: character.njk`,
        );
      } else {
        // get images inside the directory and copy over to correct places in output/public
        const images = entries.filter(
          (entry) => entry.isFile() && is_image(entry.name),
        );
        // placeholder icon
        oc.data.icon = "/public/images/characters/p/placeholder.png";

        // check images
        for (const image of images) {
          const source = path.join(directory, image.name),
            parsed = path.parse(image.name);
          let destination,
            outputName = slugify(parsed.name) + parsed.ext;
          // icon.png becomes the character's icon
          if (
            path
              .basename(image.name, path.extname(image.name))
              .toLowerCase() === "icon"
          ) {
            oc.data.icon = `/public/images/characters/${oc.data.id}/${outputName}`;
          } else if (
            path
              .basename(image.name, path.extname(image.name))
              .toLowerCase() === "portrait"
          ) {
            oc.data.portrait = `/public/images/characters/${oc.data.id}/${outputName}`;
          }
          destination = path.join(
            "output",
            "public",
            "images",
            "characters",
            String(oc.data.id),
            outputName,
          );
          // queue up the image for copying later
          queue_image(source, destination);
        }
        // return different data based on whether or not the oc should be shown in directory or not
        if (oc.data.show_in_directory == false) {
          return {
            type: "hidden_oc",
          };
        } else {
          return {
            type: "oc",
            oc,
          };
        }
      }
    } else {
      // it's a folder so build a normal directory object
      const icon = findIcon(directory);
      const result = {
        name: relativePath === "" ? character_config.base_directory : path.basename(relativePath),
        path: relativePath,
        pathParts,
        url: relativePath === "" ? `/${slugify(character_config.base_directory)}/` : `/${slugify(character_config.base_directory)}/${urlPath}/`,
        icon: findIcon(directory),
        icon_url: icon
          ? `${slugify(relativePath || "directory")}_${icon}`
          : null,
        description: getDescription(directory),
        children: [],
        files: [],
      };

      // queue the folder icon for copying if there is one
      if (icon != null) {
        let source = path.join(directory, icon),
          destination = path.join(
            "output",
            "public",
            "images",
            "folders",
            result.icon_url,
          );
        queue_image(source, destination);
      }

      // recursively trace directory tree
      for (const entry of directories) {
        const fullPath = path.join(directory, entry.name),
          childPath = relativePath
            ? `${relativePath}/${entry.name}`
            : entry.name;
        const child = scanDirectory(fullPath, childPath, ocs);

        if (!child || child.type == "hidden_oc") {
          continue;
        } else if (child.type === "oc") {
          result.files.push(child.oc);
        } else {
          result.children.push(child);
        }
      }
      result.files.sort((a, b) => a.data.id - b.data.id);
      return result;
    }
  }

  eleventyConfig.addCollection("connections", function(collection) {
    // connections page
    const ocs = validateCharacters(collection.getFilteredByTag("oc").filter(oc => oc.data.show_in_directory === true)),
          recorded_pairs = new Set(),
          final_connections = [];

    for (const oc of ocs) {

      // check for undef/null
      if (!oc.data?.connections) {
        continue;
      }

      for (const [other_oc, my_opinion] of Object.entries(oc.data.connections)) {

        // format pairs as 1-2, 3-4, etc...
        const pair = [oc.data.id, Number(other_oc)].sort((a, b) => a - b).join("-");
        
        // skip if we've already logged this combo
        if (recorded_pairs.has(pair)) {
          continue;
        }
        // log the pair as seen
        recorded_pairs.add(pair);

        // get the other oc's opinion
        const other_opinion = ocs.find(oc => oc.data.id === Number(other_oc))?.data.connections[oc.data.id];

        // save the relationship
        final_connections.push({
          char1: oc,
          char2: ocs.find(oc => oc.data.id === Number(other_oc)),
          opinion1: my_opinion,
          opinion2: other_opinion ?? "...",
          mutual: my_opinion !== undefined && other_opinion !== undefined
        })
      }
    }
    // return our final flattened list of paired opinions
    return final_connections;
  });

  // flattening the directories and making one fat collection to use w/ pagination
  eleventyConfig.addCollection(
    "characterDirectoryPages",
    function (collection) {
      const ocs = validateCharacters(collection.getFilteredByTag("oc"));
      const character_config = getCharacterConfig();

      const root = scanDirectory(charactersDir, "", ocs);
      const charactersPerPage = character_config.ocs_per_directory_page;
      const directories = [];

      function flatten(directory) {
        directories.push(directory);
        for (const child of directory.children) {
          flatten(child);
        }
      }

      flatten(root);

      const pages = [];

      for (const directory of directories) {
        const files = directory.files;
        // minimum 1 page
        const pageCount = Math.max(
          1,
          Math.ceil(files.length / charactersPerPage),
        );

        // make pages
        for (let page = 1; page <= pageCount; page++) {
          const start = (page - 1) * charactersPerPage;
          const end = start + charactersPerPage;

          pages.push({
            directory, // directory
            characters: files.slice(start, end), // characters to paginate
            page,
            pageCount,
            pageSize: charactersPerPage,
            totalCharacters: files.length,
            startCharacter: files.length === 0 ? 0 : start + 1,
            endCharacter: Math.min(end, files.length),
          });
        }
      }
      return pages;
    },
  );

  // TODO: fix this, this is from 11ty blog starter (?)
  eleventyConfig.addCollection("stories", function (collection) {
    /* The posts collection includes all posts that list 'posts' in the front matter 'tags'
           - https://www.11ty.dev/docs/collections/
        */

    // EDIT HERE WITH THE CODE FROM THE NEXT STEPS PAGE TO REVERSE CHRONOLOGICAL ORDER
    // (inspired by https://github.com/11ty/eleventy/issues/898#issuecomment-581738415)
    const stories = collection.getFilteredByTag("internal-tag-story")
      .filter((story) => story.data.show_in_directory === true)
      .sort((a, b) => b.data.date - a.data.date);

    for (const story of stories) {
      story.data.oc_data = collection.getFilteredByTag("oc").filter(oc => story.data.characters?.includes(oc.data.id)).sort((a, b) => a.data.id - b.data.id);
    }

    return stories;
  });

  eleventyConfig.addCollection("ocs_ordered_by_updated", function (collection) {
    return collection
      .getFilteredByTag("oc")
      .filter((oc) => oc.data.show_in_directory === true)
      .sort((a, b) => b.data.updated - a.data.updated);
  });

  eleventyConfig.addCollection("ocs_ordered_by_created", function (collection) {
    return collection
      .getFilteredByTag("oc")
      .filter((oc) => oc.data.show_in_directory === true)
      .sort((a, b) => b.data.created - a.data.created);
  });

  function getGallery(oc) {
    // get the directory
    const ocDirectory = path.dirname(path.resolve(oc.inputPath));
    // try to find gallery file
    const galleryPath = path.join(ocDirectory, "gallery.yaml");

    if (!fs.existsSync(galleryPath)) {
      console.warn(`No gallery file found for: ${oc.data.name} #${oc.data.id}`);
      return null;
    } else {
      try {
        const yaml = fs.readFileSync(galleryPath, "utf8");

        const data = parseYaml(yaml);

        if (data?.skip && data.skip == true) {
          console.warn(
            `Gallery file says to skip for: ${oc.data.name} #${oc.data.id}`,
          );
          return null;
        }

        let images = Array.isArray(data?.images) ? data.images : [];

        for (const img of images) {
          const full = path.parse(img.full);
          const thumbnail =
            img.thumbnail != null ? path.parse(img.thumbnail) : null;

          img.full_url = `/public/images/characters/${oc.data.id}/${slugify(full.name)}${full.ext}`;
          img.thumb_url =
            thumbnail == null
              ? null
              : `/public/images/characters/${oc.data.id}/${slugify(thumbnail.name)}${thumbnail.ext}`;
        }
        return images;
      } catch (error) {
        throw new Error(
          `Could not parse gallery.yaml for "${oc.data.name}": ${error.message}`,
        );
      }
    }
  }
  eleventyConfig.addCollection("ocs_ordered_by_id", function (collection) {
    return collection
      .getFilteredByTag("oc")
      .filter((oc) => oc.data.show_in_directory === true)
      .sort((a, b) => a.data.id - b.data.id);
  });
  eleventyConfig.addCollection("featured_ocs", function (collection) {
    let ocs = collection
      .getFilteredByTag("oc")
      .filter(
        (oc) => oc.data.show_in_directory === true && oc.data.featured === true,
      )
      .sort((a, b) => a.data.id - b.data.id);
    return ocs;
  });

  eleventyConfig.addCollection("oc_taglist", function (collection) {
    const tags = buildGroupedOCs(collection.getFilteredByTag("oc"),"tags");
    return Object.values(tags).map(tag => (tag.name)).sort();
  });

  // world & tag builder helper function
  function buildGroupedOCs(coll, dataset, alt = null) {
    // make an object to hold flattened result, we call it tags here but this is generic to handle both tags and worlds
    const tags = {};
    const character_config = getCharacterConfig();

    // iterate over ocs
    for (const oc of coll) {
      // ocs are only included in directory listings if specified
      if (oc.data.show_in_directory == true) {
        for (const tag of oc.data[dataset] || []) {
          if (tag !== "oc" && tag !== "all") {
            const key_val = tag.trim().toLowerCase();
            if (!tags[key_val]) {
              tags[key_val] = {
                name: tag,
                ocs: []
              };
            } else {
              oc.data[dataset][tag] = tags[key_val].name
            }
            tags[key_val].ocs.push({
              name: oc.data.name,
              icon: oc.data.icon,
              page_url: oc.url,
              updated: oc.data.updated,
              created: oc.data.created,
              id: oc.data.id,
            });
          }
        }
      }
    }

    for (const tag of Object.keys(tags)) {
      tags[tag].ocs.sort((a, b) => {
        if (character_config.tag_and_world_sort_type === "created") {
          return b.created - a.created;
        } else if (character_config.tag_and_world_sort_type === "updated" || alt === "updated") {
          return b.updated - a.updated;
        } else if (character_config.tag_and_world_sort_type === "id" || alt === "id") {
          return a.id - b.id;
        } else {
          throw new Error(`Invalid value for config value: tag_and_world_sort_type`)
        }
      });
    }
    return tags;
  }


  eleventyConfig.addCollection("oc_worlds", function (collection) {
    const worlds = buildGroupedOCs(
      collection.getFilteredByTag("oc"),
      "worlds",
    );
    return getWorldMetadata(worlds);
  });
  eleventyConfig.addCollection("oc_worldlist", function (collection) {
    const worlds = buildGroupedOCs(
      collection.getFilteredByTag("oc"),
      "worlds",
    );
    const final_worlds = getWorldMetadata(worlds);
    return Object.values(final_worlds).sort((a, b) => a.name.localeCompare(b.name));
  });

  function readWorldDescription(directory,filename) {
    const source = fs.readFileSync(path.join(directory,filename), "utf8").trim();
    const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);

    if (!match) {
      throw new Error(`Must have YAML data in World file: ${path.join(directory,filename)}`)
    }

    const content = match[2];
    const data = parseYaml(match[1]);

    if (!data?.name) {
      throw new Error(`Must have a World Name specified in file: ${path.join(directory,filename)}`)
    }

    return {
      name: data.name,
      data,
      content,
      content_html: md.render(content)
    };
  }

  function getWorldMetadata(worlds) {
    // make sure worlds exists
    const directory = path.join("src","worlds");
    if (!fs.existsSync(directory)) {
      throw new Error (`src/worlds directory must exist even if empty.`)
    }
    // read files and grab the markdowns
    const entries = fs.readdirSync(directory, { withFileTypes: true,}).filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".md",
    );
    const world_description_files = [];
    // reading world description, will get the name from the YAML frontmatter header
    for (const file of entries) {
      world_description_files.push(readWorldDescription(directory,file.name));
    }
    // mapping the description files to the world description content
    const world_descriptions = new Map(
      world_description_files.map(world => [world.name.toLowerCase(), world])
    );
    const final_worlds = {};
    // build new list of worlds to work with that contains the optional description
    for (const [name, world] of Object.entries(worlds)) {
      const description = world_descriptions.get(name.toLowerCase());
      final_worlds[name] = {
        name: description?.name ?? name,
        ocs: world.ocs,
        description: description?.content ?? null,
        description_html: description?.content_html ?? null,
        data: description?.data ?? {}
      };
    }
    return final_worlds;
  }

  eleventyConfig.addCollection("oc_world_pages", function (collection) {
    const character_config = getCharacterConfig(),
          charactersPerPage = character_config.ocs_per_directory_page,
          worlds = buildGroupedOCs(
            collection.getFilteredByTag("oc"),
            "worlds",
          );
    const final_worlds = getWorldMetadata(worlds);

    // go thru all worlds and return a flat list of pages that we will have the built-in pagination generate pages for
    // next/prev page links in the template are based on page and total page count
    const result = [];

    for (const world of Object.values(final_worlds)) {
      const pageCount = Math.ceil(world.ocs.length / charactersPerPage);

      for (let page = 0; page < pageCount; page++) {
        result.push({
          ...world, // include all of world
          ocs: world.ocs.slice(page * charactersPerPage, (page + 1) * charactersPerPage),
          page: page + 1,
          pageCount,
        });
      }
    }
    return result;
  });

  eleventyConfig.addCollection("oc_tag_pages", function (collection) {
    const character_config = getCharacterConfig(),
          charactersPerPage = character_config.ocs_per_directory_page,
          tags = buildGroupedOCs(
            collection.getFilteredByTag("oc"),
            "tags",
            "updated"
          );
    // go thru all worlds and return a flat list of pages that we will have the built-in pagination generate pages for
    // next/prev page links in the template are based on page and total page count
    const result = [];

    for (const tag of Object.values(tags)) {
      const pageCount = Math.ceil(tag.ocs.length / charactersPerPage);

      for (let page = 0; page < pageCount; page++) {
        result.push({
          ...tag, // include all of world
          ocs: tag.ocs.slice(page * charactersPerPage, (page + 1) * charactersPerPage),
          page: page + 1,
          pageCount,
        });
      }
    }
    return result;
  });

  eleventyConfig.addCollection("navigation", function (collection) {
    // making a special object collection of tags
    return collection
      .getFilteredByTag("navigation")
      .sort((a, b) => a.data.order - b.data.order);
  });

  eleventyConfig.on("eleventy.after", async () => {
    // copying over added images here :)
    let image;
    while ((image = images_to_copy.pop())) {
      const { source, destination } = image;

      fs.mkdirSync(path.dirname(destination), {
        recursive: true,
      });

      fs.copyFileSync(source, destination);
    }
  });
}
