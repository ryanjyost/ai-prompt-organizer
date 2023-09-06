const fs = require("fs");
const path = require("path");
const { fileURLToPath } = require("url");
const { Liquid } = require("liquidjs");
const { globSync } = require("glob");

console.log("PromptManager");
// TODO https://stackoverflow.com/questions/29738381/how-to-publish-a-module-written-in-es6-to-npm

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const LiquidEngine = new Liquid({ globals: {} });

class PromptManager {
  constructor() {
    this.prompts = {};
    this.partials = {};
    this.config = {
      source: path.join(__dirname, "prompts"),
      debug: false,
    };
  }

  logPrompts(obj, depth = 0) {
    // console.log("GOT PROMPTS", this.prompts);

    const indent = "  ".repeat(depth);

    // Iterate through object properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // Check if the value is an object (nested)
        if (typeof value === "object" && value !== null) {
          console.log(`\n${indent}📁${key}`);
          this.logPrompts(value, depth + 1); // Recursively log nested objects
        } else {
          console.log("")
          console.log(`${indent}${key}`);
          console.log(`${indent}"${value}"`);
        }
      }
    }
  }

  init(config) {
    this.config = deepMerge(this.config, config || {});
    this.gatherPrompts();
    if (this.config.debug) {
      console.log("*****", "PROMPT LIBRARY", "*****");
      this.logPrompts(this.prompts);
      console.log("\n*****", "PARTIALS", "*****");
      this.logPrompts(this.partials);
    }
  }

  gatherPrompts() {
    const fullPath = this.config.source;

    // const items = await fs.promises.readdir(fullPath);
    const items = globSync("**/*.js", {
      cwd: fullPath,
      ignore: "node_modules/**",
    });

    for (const item of items) {
      const itemPath = path.join(fullPath, item);
      // const stats = await fs.promises.stat(itemPath);
      const isIndex = item === "index.js";
      const isPartials = item === "partials.js";
      const isJsFile = item.endsWith(".js");
      const isDirectory = !item.includes(".");

      console.log({ item, isIndex, isPartials, isJsFile, isDirectory });

      if (isJsFile) {
        const promptModule = require(itemPath);

        const promptsInThisModule = {
          ...promptModule.default,
          ...promptModule,
        };

        delete promptsInThisModule.default;

        if (isIndex) {
          this.prompts = deepMerge(this.prompts, promptsInThisModule);
        } else if (isPartials) {
          this.partials = deepMerge(this.partials, promptsInThisModule);
        } else {
          const prop = item.replace(".js", "");
          this.prompts[prop] = deepMerge(
            this.prompts[prop] || {},
            promptsInThisModule
          );
        }
      }
    }

    return;
  }

  // async gatherPartials() {
  //   const fullPath = this.config.source;
  //   try {
  //     const partialsModule = await import(path.join(fullPath, "partials.js"));

  //     const partialsInThisModule = deepMerge(
  //       { ...partialsModule.default },
  //       { ...partialsModule }
  //     );

  //     delete partialsInThisModule.default;

  //     this.partials = deepMerge(this.partials || {}, partialsModule);
  //   } catch (e) {
  //     console.log("No partials file");
  //   }
  // }

  getPrompt(promptPath, variables) {
    const promptPreInjection = _get(this.prompts, promptPath) || "";
    // console.log({ variables });
    // console.log({ promptPreInjection, partials: this.partials });

    const finalInputs = deepMerge(
      { partials: this.partials },
      { inputs: variables }
    );
    console.log({ finalInputs });
    const final = LiquidEngine.parseAndRenderSync(
      promptPreInjection,
      finalInputs
    );

    console.log({ final });

    // console.log({ final });

    return final.trim();
  }
}

const manager = new PromptManager();

module.exports = manager;

function logObject(obj) {}

function _get(object, dotNotation) {
  const keys = dotNotation.split(".");
  let currentObj = object;

  for (const key of keys) {
    if (!currentObj.hasOwnProperty(key)) {
      return undefined;
    }
    currentObj = currentObj[key];
  }

  return currentObj;
}

function _set(object, dotNotation, value) {
  const keys = dotNotation.split(".");
  let currentObj = object;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!currentObj.hasOwnProperty(key)) {
      currentObj[key] = {};
    }
    currentObj = currentObj[key];
  }

  currentObj[keys[keys.length - 1]] = value;
}

function deepMerge(target, ...sources) {
  if (!sources.length) return target;

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
