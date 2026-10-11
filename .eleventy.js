import path from "node:path";
import fs from "node:fs";
import markdownIt from "markdown-it";
import { getCharacterConfig } from "./src/_lib/character_config.js";
import { prettyText } from "./src/_lib/pretty_text.js";
import { parse as parseYaml } from "yaml";

// needed to convert folder description md files into markdown usable on the pages
const md = markdownIt({
  html: true,
  breaks: true,
});

// MAIN
export default function (eleventyConfig) {

  // get character config
  const characterConfig = getCharacterConfig();
  // resolve character directory
  const charactersDirectory = path.resolve(process.cwd(), `src/${characterConfig.base_directory}`);
  // make sure it exists, if not end the process
  if (!fs.existsSync(charactersDirectory)) {
    throw new Error(`Characters directory not found (must match config): ${charactersDirectory}`);
  }

  // skip when building for now
  eleventyConfig.setUseGitIgnore(false);
  // watch for config file changes
  eleventyConfig.addWatchTarget("./src/_data/character_config.json");
  // watching for new images and for updated css
  eleventyConfig.addWatchTarget(
    `./src/${characterConfig.base_directory}/**/*.{md,css,yaml,png,jpg,jpeg,webp,gif,avif,svg}`
  );

  // setup directory stuff
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_layouts");
  eleventyConfig.setOutputDirectory("output");
  eleventyConfig.setInputDirectory("src");

  // ignore folder descriptions & README files
  eleventyConfig.ignores.add(`src/worlds`);

  // we will NOT be automatically pulling in static assets here
  // anything stored in the characters folder will be copied over programatically
  // put non-character assets like backgrounds or custom css files in the public folder...
  eleventyConfig.setTemplateFormats(["html", "njk", "md"]);
  // ...because that's being directly copied to our output
  eleventyConfig.addPassthroughCopy("public");


  // include slugifier access for our later functions
  const Slugify = eleventyConfig.getFilter("slugify");

  // stuff for moving over folder & character images later
  const filesToCopy = [],
        validImageTypes = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];
  function queueFileToCopy(source, destination) {
    filesToCopy.push({
      source,
      destination,
    });
  }
  function copyFileOnlyIfChanged(src, dest) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (
      !fs.existsSync(dest) ||
      !fs.readFileSync(src).equals(fs.readFileSync(dest))
    ) {
      fs.copyFileSync(src, dest);
    }
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

  // oc filters for homepage
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

    // keep list of all ocs to handle invalid connections
    const ocsById = new Map(
      ocs.map((oc) => [oc.data.id, oc]),
    );

    // checking for duplicate IDs/URLs
    for (const oc of ocs) {

      oc.data.id = Number(oc.data.id);
      const id = oc.data.id,
            url = oc.url;

      // error for invalid IDs
      if (!Number.isInteger(id) || Number(id) <= 0) {
        errors.push(
          `OC ${oc.data.name} ID must be a positive integer in ${oc.inputPath}: "${oc.data.id}"`,
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
        urls.set(url, oc);
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
      if (oc.data?.friends) {
        const hiddenFriends = [];
        oc.data.friends.forEach(otherOc => {

          if (!ocsById.get(Number(otherOc))) {
            errors.push(
              `Oc ${oc.data.name} #${oc.data.id} has an invalid friend: ${otherOc}`
            );
          } else if (!ocsById.get(Number(otherOc)).data.show_in_directory) {
            hiddenFriends.push(`- ${ocsById.get(Number(otherOc)).data.name} #${ocsById.get(Number(otherOc)).data.id}`)
          }
        })
        if (hiddenFriends.length > 0) {
          console.warn('- ',prettyText(`Oc ${oc.data.name} #${oc.data.id} has one or more hidden friends. Make sure this was on purpose before you publish!\n\tHidden Characters:\n\t${hiddenFriends.join("\n\t")}`,{ color : 'yellow'}))
        }
      }
      if (oc.data?.enemies) {
        const hiddenEnemies = [];
        oc.data.enemies.forEach(otherOc => {
          if (!ocsById.get(Number(otherOc))) {
            errors.push(
              `Oc ${oc.data.name} #${oc.data.id} has an invalid enemy: ${otherOc}`
            );
          } else if (!ocsById.get(Number(otherOc)).data.show_in_directory) {
            hiddenEnemies.push(`- ${ocsById.get(Number(otherOc)).data.name} #${ocsById.get(Number(otherOc)).data.id}`)
          }
        })

        if (hiddenEnemies.length > 0) {
          console.warn('- ',prettyText(`Oc ${oc.data.name} #${oc.data.id} has one or more hidden enemies. Make sure this was on purpose before you publish!\n\tHidden Characters:\n\t${hiddenEnemies.join("\n\t")}`,{ color : 'yellow'}))
        }
      }
      if (oc.data?.connections) {
        for (const otherOc of Object.keys(oc.data.connections)) {
          // skip connections
          if (!ocsById.get(Number(otherOc))) {
            errors.push(
              `Oc ${oc.data.name} #${oc.data.id} has connection to invalid oc ${otherOc}`
            );
          }
        }
      }
    }
    if (errors.length > 0) {
      console.error(prettyText("Character Validation Failed!", { color: 'black', bg: 'red', bold: true, bright: true}));
      throw new Error(`\n${prettyText('OC Errors:')}\n\t- ${errors.join("\n\t- ")}`);
    }
    console.log(prettyText("Character Validation Succeeded!", { color: 'black', bg: 'green', bold: true, bright: true}));
    return ocs;
  }

  // HELPER FUNCTIONS
  function isImage(filename) {
    return validImageTypes.includes(path.extname(filename).toLowerCase());
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
          isImage(entry.name),
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

  function scanDirectory(directory, relativePath = "", ocs = [], slugifiedPathsListCounter = new Set()) {
    // storing slugified path urls for breadcrumbs
    const pathParts = [];
    let urlPath = "";
    const characterConfig = getCharacterConfig();

    if (relativePath !== "") {
      for (const part of relativePath.split("/")) {
        const slug = Slugify(part);

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
      const markdownFiles = entries.filter(
        (entry) =>
          entry.isFile() && path.extname(entry.name).toLowerCase() === ".md",
      );

      // ERROR CHECKING
      // do not allow multiple markdown files since 11ty will generate junk pages for md files that don't have permalink: false in their frontmatter
      if (markdownFiles.length !== 1) {
        throw new Error(
          markdownFiles.length === 0
            ? `No markdown file in OC container: ${directory}`
            : `Multiple markdown files in OC container: ${directory}`,
        );
      }

      // validate it against the ocs collection
      const inputPath = path.resolve(directory, markdownFiles[0].name);
      let oc = ocs.find((item) => path.resolve(item.inputPath) === inputPath);
      if (!oc) {
        throw new Error(
          `No OC found for: ${inputPath}. Make sure your frontmatter has layout: character.njk`,
        );
      } else {
        // get images inside the directory and copy over to correct places in output/public
        const images = entries.filter(
          (entry) => entry.isFile() && isImage(entry.name),
        );
        const css = entries.find(
          (entry) =>
            entry.isFile() && path.extname(entry.name).toLowerCase() === ".css",
          );

        if (css) {
          const source = path.join(directory, css.name),
            parsed = path.parse(css.name),
            outputName = Slugify(`css-${oc.data.name}-id-${oc.data.id}`) + parsed.ext;

          // assign custom css file
          oc.data.custom_css = outputName;
          const destination = path.join(
            "output",
            "public",
            "css",
            outputName,
          );
          // queue up the file for copying later
          queueFileToCopy(source, destination);
        }
        // placeholder icon
        oc.data.icon = "/public/images/characters/p/placeholder.png";

        // set to check for edge case of colliding slugs
        const slugsUsed = new Set();
        // check images
        for (const image of images) {
          const source = path.join(directory, image.name),
            parsed = path.parse(image.name);
          let destination,
            outputName = Slugify(parsed.name) + parsed.ext;
          // icon.png becomes the character's icon
          if (slugsUsed.has(outputName)) {
            throw new Error(`Issue with image file names in character container:\n${directory}!\nMultiple files slugify to "${outputName}". Please rename your files to prevent images from overwriting eachother.`)
          }
          slugsUsed.add(outputName);
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
          queueFileToCopy(source, destination);
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
        name: relativePath === "" ? characterConfig.base_directory : path.basename(relativePath),
        path: relativePath,
        pathParts,
        url: relativePath === "" ? `/${Slugify(characterConfig.base_directory)}/` : `/${Slugify(characterConfig.base_directory)}/${urlPath}/`,
        icon: icon,
        icon_url: icon
          ? `${Slugify(relativePath || "directory")}_${icon}`
          : null,
        description: getDescription(directory),
        children: [],
        files: [],
      };
      if (slugifiedPathsListCounter.has(result.url)) {
        throw new Error(`Issue with folders in directory: ${directory.split(path.sep).slice(0, -1).join(path.sep)}!\nThere are multiple folders whose names slugify to "${pathParts[pathParts.length - 1].slug}", please rename one of them.`);
      }
      slugifiedPathsListCounter.add(result.url);

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
        queueFileToCopy(source, destination);
      }

      // recursively trace directory tree
      for (const entry of directories) {
        const fullPath = path.join(directory, entry.name),
          childPath = relativePath
            ? `${relativePath}/${entry.name}`
            : entry.name;
        const child = scanDirectory(fullPath, childPath, ocs, slugifiedPathsListCounter);

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

  eleventyConfig.addCollection("connections", function (collection) {
    // connections page
    const ocs = collection.getFilteredByTag("oc").filter(oc => oc.data.show_in_directory === true),
      recordedPairs = new Set(),
      finalConnections = [];

    const ocsById = new Map(
      ocs.map((oc) => [oc.data.id, oc]),
    );

    for (const oc of ocs) {

      // check for undef/null
      if (!oc.data?.connections) {
        continue;
      }

      for (const [otherOc, myOpinionOfThem] of Object.entries(oc.data.connections)) {

        // format pairs as 1-2, 3-4, etc...
        const pair = [oc.data.id, Number(otherOc)].sort((a, b) => a - b).join("-");

        // skip if we've already logged this combo
        if (recordedPairs.has(pair)) {
          continue;
        }
        // log the pair as seen
        recordedPairs.add(pair);

        // get the other oc's opinion, might be undefined but that's okay because we address it later
        const theirOpinionOfMe = ocsById.get(Number(otherOc))?.data.connections[oc.data.id];

        // save the relationship
        finalConnections.push({
          char1: oc,
          char2: ocs.find(oc => oc.data.id === Number(otherOc)),
          opinion1: myOpinionOfThem,
          opinion2: theirOpinionOfMe ?? "...",
          mutual: myOpinionOfThem !== undefined && theirOpinionOfMe !== undefined
        })
      }
    }
    // return our final flattened list of paired opinions
    return finalConnections;
  });

  // flattening the directories into an array to use w/ pagination
  eleventyConfig.addCollection(
    "characterDirectoryPages",
    function (collection) {
      const ocs = collection.getFilteredByTag("oc");
      const characterConfig = getCharacterConfig();

      const root = scanDirectory(charactersDirectory, "", ocs);

      // moving file copying here specifically to allow for better handling when using --serve
      let file;
      console.log(`Checking ${filesToCopy.length} and copying new/changed files to output assets directory...`);
      while ((file = filesToCopy.pop())) {
        const { source, destination } = file;
        copyFileOnlyIfChanged(source, destination);
      }
      console.log(prettyText(`File copying was successful!`,{ color: 'green' }));

      const ocsPerPage = characterConfig.ocs_per_directory_page;
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
          Math.ceil(files.length / ocsPerPage),
        );

        // make pages
        for (let page = 1; page <= pageCount; page++) {
          const start = (page - 1) * ocsPerPage;
          const end = start + ocsPerPage;

          pages.push({
            directory, // directory
            characters: files.slice(start, end), // characters to paginate
            page,
            pageCount: pageCount,
            pageSize: ocsPerPage,
            totalCharacters: files.length,
            startCharacter: files.length === 0 ? 0 : start + 1,
            endCharacter: Math.min(end, files.length),
          });
        }
      }
      return pages;
    },
  );

  eleventyConfig.addCollection("stories", function (collection) {

    const stories = collection.getFilteredByTag("internal-tag-story")
      .filter((story) => story.data.show_in_directory === true)
      .sort((a, b) => b.data.date - a.data.date);

    for (const story of stories) {
      story.data.oc_data = collection.getFilteredByTag("oc").filter(oc => story.data.characters?.includes(oc.data.id)).sort((a, b) => a.data.id - b.data.id);
      const hiddenCharacters = [];
      story.data.oc_data.forEach(oc => {
        if (oc.data.show_in_directory === false) {
          hiddenCharacters.push(`- ${oc.data.name} #${oc.data.id}`)
        }
      })
      if (hiddenCharacters.length > 0) {
        console.warn('- ',prettyText(`Story "${story.data.title}" has hidden characters included in the featured ocs. Make sure this was on purpose before you publish!\n\tHidden Characters:\n\t${hiddenCharacters.join(`\n\t`)}`,{ color : 'yellow'}))
      }
    }

    return stories;
  });

  eleventyConfig.addCollection("ocsByUpdatedDate", function (collection) {
    return collection
      .getFilteredByTag("oc")
      .filter((oc) => oc.data.show_in_directory === true)
      .sort((a, b) => b.data.updated - a.data.updated);
  });

  eleventyConfig.addCollection("ocsByCreationDate", function (collection) {
    return collection
      .getFilteredByTag("oc")
      .filter((oc) => oc.data.show_in_directory === true)
      .sort((a, b) => b.data.created - a.data.created);
  });

  function getGallery(oc) {
    // get the directory
    const ocContainerDir = path.dirname(path.resolve(oc.inputPath));
    // try to find gallery file
    const galleryFile = path.join(ocContainerDir, "gallery.yaml");

    if (!fs.existsSync(galleryFile)) {
      console.warn('- ',prettyText(`No gallery file found for: ${oc.data.name} #${oc.data.id}`,{ color: 'grey' }));
      return null;
    } else {
      try {
        const data = parseYaml(fs.readFileSync(galleryFile, "utf8"));
        let images = Array.isArray(data?.images) ? data.images : [];

        for (const img of images) {
          const full = path.parse(img.full);
          const thumbnail =
            img.thumbnail != null ? path.parse(img.thumbnail) : null;

          img.full_url = `/public/images/characters/${oc.data.id}/${Slugify(full.name)}${full.ext}`;
          img.thumb_url =
            thumbnail == null
              ? null
              : `/public/images/characters/${oc.data.id}/${Slugify(thumbnail.name)}${thumbnail.ext}`;
        }
        return images;
      } catch (error) {
        throw new Error(
          `Could not parse gallery.yaml for "${oc.data.name}": ${error.message}`,
        );
      }
    }
  }
  eleventyConfig.addCollection("ocsById", function (collection) {
    return collection
      .getFilteredByTag("oc")
      .filter((oc) => oc.data.show_in_directory === true)
      .sort((a, b) => a.data.id - b.data.id);
  });

  eleventyConfig.addCollection("ocTagsList", function (collection) {
    const tags = buildGroupedOCs(collection.getFilteredByTag("oc"), "tags");
    return Object.values(tags).map(tag => (tag.name)).sort();
  });

  eleventyConfig.addCollection("characterSubpages", function (collection) {
    const ocs = collection.getFilteredByTag("oc");
    const pages = [];
    const character_config = getCharacterConfig();

    for (const oc of ocs) {

      // use character override value if defined otherwise use global config setting
      const multiPageLayout = oc.data.multi_page_layout ?? character_config.multi_page_layout;

      // if config says use multi layout or the oc override is true, process pages
      if (multiPageLayout) {

        // push page only if at least 1 of friends/enemies or connections exists and they should show in directory
        if ((oc.data?.friends?.length > 0) ||
          (oc.data?.enemies?.length > 0) ||
          (Object.keys(oc.data.connections ?? {}).length > 0 && oc.data.show_in_directory)) {
          pages.push({
            oc,
            section: "relationships",
            permalink: `${oc.url}relationships/`
          });
        }
        // get the directory
        const ocContainerDir = path.dirname(path.resolve(oc.inputPath));
        // try to find gallery file
        const galleryFile = path.join(ocContainerDir, "gallery.yaml");

        // push gallery gen only if the oc has a gallery file present
        if (fs.existsSync(galleryFile)) {
          pages.push({
            oc,
            section: "gallery",
            permalink: `${oc.url}gallery/`
          });
        }
      }
    }

    return pages;
  });

  // world & tag builder helper function
  function buildGroupedOCs(coll, dataset, alt = null) {
    // make an object to hold flattened result, we call it tags here but this is generic to handle both tags and worlds
    const categories = {};
    const characterConfig = getCharacterConfig();

    // iterate over ocs
    for (const oc of coll) {
      // ocs are only included in directory listings if specified
      if (oc.data.show_in_directory == true) {

        for (const category of oc.data[dataset] || []) {
          // we do not want all or oc to be part of our collection when using this for tag building
          if (category !== "oc" && category !== "all") {
            const keyValue = category.trim().toLowerCase();
            if (!categories[keyValue]) {
              categories[keyValue] = {
                name: category,
                ocs: []
              };
            } else {
              const index = oc.data[dataset].indexOf(category);
              if (index !== -1) {
                  oc.data[dataset][index] = categories[keyValue].name;
              }
            }
            categories[keyValue].ocs.push({
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

    for (const key of Object.keys(categories)) {
      categories[key].ocs.sort((a, b) => {
        const sortType = alt ?? characterConfig.tag_and_world_sort_type;
        if (sortType === "created") {
          return b.created - a.created;
        } else if (sortType === "updated") {
          return b.updated - a.updated;
        } else if (sortType === "id") {
          return a.id - b.id;
        } else {
          throw new Error(`Invalid value for config value tag_and_world_sort_type: ${characterConfig.tag_and_world_sort_type}`)
        }
      });
    }
    return categories;
  }


  eleventyConfig.addCollection("ocWorlds", function (collection) {
    const worlds = buildGroupedOCs(
      collection.getFilteredByTag("oc"),
      "worlds",
    );
    return getWorldMetadata(worlds);
  });
  eleventyConfig.addCollection("ocWorldsList", function (collection) {
    const worlds = buildGroupedOCs(
      collection.getFilteredByTag("oc"),
      "worlds",
    );
    const finalWorldList = getWorldMetadata(worlds);
    return Object.values(finalWorldList).sort((a, b) => a.name.localeCompare(b.name));
  });

  function readWorldDescription(directory, filename) {
    const source = fs.readFileSync(path.join(directory, filename), "utf8").trim();
    const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);

    if (!match) {
      throw new Error(`Must have YAML data in World file: ${path.join(directory, filename)}`)
    }

    const content = match[2];
    const data = parseYaml(match[1]);

    if (!data?.name) {
      throw new Error(`Must have a World Name specified in file: ${path.join(directory, filename)}`)
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
    const directory = path.join("src", "worlds");
    if (!fs.existsSync(directory)) {
      throw new Error(`src/worlds directory must exist even if empty.`)
    }
    // read files and grab the markdowns
    const entries = fs.readdirSync(directory, { withFileTypes: true, }).filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".md",
    );
    const worldMetadataFiles = [];
    // reading world description, will get the name from the YAML frontmatter header
    for (const file of entries) {
      worldMetadataFiles.push(readWorldDescription(directory, file.name));
    }
    // mapping the description files to the world description content
    const worldMetadata = new Map(
      worldMetadataFiles.map(world => [world.name.toLowerCase(), world])
    );
    const finalWorldsList = {};
    // build new list of worlds to work with that contains the optional description
    for (const [name, world] of Object.entries(worlds)) {
      const description = worldMetadata.get(name.toLowerCase());
      finalWorldsList[name] = {
        name: description?.name ?? name,
        ocs: world.ocs,
        description: description?.content ?? null,
        description_html: description?.content_html ?? null,
        data: description?.data ?? {}
      };
    }
    return finalWorldsList;
  }

  eleventyConfig.addCollection("ocWorldPages", function (collection) {
    const characterConfig = getCharacterConfig(),
      charactersPerPage = characterConfig.ocs_per_directory_page,
      worlds = buildGroupedOCs(
        collection.getFilteredByTag("oc"),
        "worlds",
      );
    const finalWorldsList = getWorldMetadata(worlds);

    // go thru all worlds and return a flat list of pages that we will have the built-in pagination generate pages for
    // next/prev page links in the template are based on page and total page count
    const result = [];

    for (const world of Object.values(finalWorldsList)) {
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

  eleventyConfig.addCollection("ocTagPages", function (collection) {
    const characterConfig = getCharacterConfig(),
      charactersPerPage = characterConfig.ocs_per_directory_page,
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

//   eleventyConfig.on("eleventy.after", async () => {
//     // copying over added images here :)
//     let image;
//     while ((image = imagesToCopy.pop())) {
//       const { source, destination } = image;
//
//       fs.mkdirSync(path.dirname(destination), {
//         recursive: true,
//       });
//
//       fs.copyFileSync(source, destination);
//     }
//   });
}
