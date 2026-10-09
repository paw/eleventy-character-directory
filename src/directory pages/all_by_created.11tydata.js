// 11ty data makes it possible for the pagination of collections to be controlled by the config

import { getCharacterConfig } from "../_lib/character_config.js";

export default function() {
  const config = getCharacterConfig();

  return {
    pagination: {
      data: "collections.ocsByCreationDate",
      size: config.ocs_per_directory_page,
      reverse: false
    }
  };
}