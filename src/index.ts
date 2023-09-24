const path = require('path');
const { fileURLToPath } = require('url');
const { Liquid } = require('liquidjs');
const { globSync } = require('glob');

const LiquidEngine = new Liquid({ globals: {} });

interface IPromptManagerConfig {
  source: string;
  debug?: boolean;
}

class PromptManager {
  prompts: any;
  partials: any;
  config: IPromptManagerConfig;

  constructor() {
    console.log('WORKING');
    // const src = path.join(__dirname, 'prompts', "../..");
    const src = path.join(__dirname, '../../..', 'prompts');
    this.config = {
      source: src,
      debug: false,
    };
    this.prompts = this._gatherPrompts();
    this.partials = {};

    this.config.debug && console.log('__dirname', __dirname, 'src', src);
  }

  logPrompts(obj: any, depth = 0) {
    const indent = '  '.repeat(depth);

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          console.log(`\n${indent}📁${key}`);
          this.logPrompts(value, depth + 1); // Recursively log nested objects
        } else {
          console.log(`${indent}💬${key} = "${value}"`);
        }
      }
    }
  }

  init(config: IPromptManagerConfig) {
    this.config = deepMerge(this.config, config || {});
    this.prompts = this._gatherPrompts();

    if (this.config.debug) {
      console.log('***** Config *****\n');
      console.log(JSON.stringify(this.config, null, 4));
      console.log('\n***** Prompt Library *****');
      console.log(JSON.stringify(this.prompts, null, 4));
    }
  }

  _gatherPrompts(dirPath?: string, prefix?: string, prevLevels?: string[]) {
    const fullPath = dirPath || this.config.source;
    let levels: string[] = [...(prevLevels || [])];

    const items = globSync('**/*.{js,cjs}', {
      cwd: fullPath,
      ignore: 'node_modules/**',
    });

    let library: any = {};

    for (const item of items) {
      const itemPath = path.join(fullPath, item);
      const isIndex = item.split('.')[0] === 'index';
      const extension = item.split('.')[1];
      const isJsFile = item.endsWith('.js') || item.endsWith('.cjs');
      const isDirectory = item.includes('/');

      if (isDirectory) {
        const dirName = item.split('/')[0];
        levels.push(dirName);
        const value = this._gatherPrompts(path.join(fullPath, dirName), dirName, levels);
        _set(library, dirName, value);
      } else if (isJsFile) {
        const promptModule = require(itemPath);

        if (typeof promptModule === 'string') {
          const prop = item.replace('.' + extension, '');
          library[prop] = promptModule;
          continue;
        }

        const promptsInThisModule = {
          ...promptModule.default,
          ...promptModule,
        };

        if (
          itemPath ===
          '/Users/ryanjyost/Projects/ai-prompt-organizer-tutorial/prompts/folderA/folderB/folderC/nestedFile.cjs'
        ) {
          console.log({ promptsInThisModule });
        }

        delete promptsInThisModule.default;

        if (isIndex) {
          library = deepMerge(library, promptsInThisModule);
        } else {
          const prop = item.replace('.' + extension, '');
          console.log({ prop });
          library[prop] = deepMerge(library[prop] || {}, promptsInThisModule);
          console.log({ library });
        }
      }
    }

    return library;
  }

  _getAllOutputsFromPrompt(rawPrompt: string) {
    rawPrompt = String(rawPrompt) || '';
    const regex = /\{\{([^}]+)\}\}/;
    const arrayOfVarNames = (rawPrompt.match(/\{\{([^}]+)\}\}/g) || []).map((match: any) => match?.match(regex)[1]);
    const obj: any = {};

    arrayOfVarNames.forEach((varName: string) => {
      obj[varName] = true;
    });
    return Object.keys(obj);
  }

  use(prompt: string, inputs?: any) {
    const outputs = this._getAllOutputsFromPrompt(prompt);
    if (!outputs.length) {
      return prompt;
    }

    const finalInputs = inputs ? { inputs } : {};

    for (const output of outputs) {
      const outputValue = _get(this.prompts, output);

      if (!outputValue) {
        continue;
      }

      _set(finalInputs, output, this.use(outputValue, inputs));
    }

    const final = LiquidEngine.parseAndRenderSync(prompt, finalInputs);

    this.config.debug && console.log(final);

    return final; // TODO all sorts of clean up
  }

  get(promptPath: string, inputs?: any) {
    const promptPreInjection = _get(this.prompts, promptPath) || '';
    return this.use(promptPreInjection, inputs);
  }
}

const manager = new PromptManager();

module.exports = manager;

function _get(object: any, dotNotation: string) {
  const keys = (dotNotation || '').split('.');
  let currentObj = object || {};

  for (const key of keys) {
    if (!currentObj.hasOwnProperty(key)) {
      return undefined;
    }
    // console.log(JSON.stringify({ currentObj }));

    currentObj = currentObj[key] || {};
  }

  return currentObj;
}

function _set(obj: any, dotNotation: string, value: any) {
  const keys = dotNotation.split('.');
  let currentObj = obj;

  function recursiveSet(obj: any, keys: any[], value: any, index = 0) {
    const key = keys[index];

    if (index === keys.length - 1) {
      obj[key] = value;
    } else {
      if (!obj[key] || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      recursiveSet(obj[key], keys, value, index + 1);
    }
  }

  recursiveSet(currentObj, keys, value);

  return obj;
}

function deepMerge(target: any, ...sources: any) {
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

function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
