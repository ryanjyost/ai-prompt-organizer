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
    // const src = path.join(__dirname, 'prompts', "../..");
    const src = path.join(__dirname, '../../ai-prompt-manager-example-project/prompts');
    this.config = {
      source: src,
      debug: true,
    };
    this.prompts = this.gatherPrompts();
    this.partials = {};
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
    this.prompts = this.gatherPrompts();

    if (this.config.debug) {
      console.log('***** Config *****\n');
      console.log(JSON.stringify(this.config, null, 4));
      console.log('\n***** Prompt Library *****');
      console.log(JSON.stringify(this.prompts, null, 4));
    }
  }

  gatherPrompts(dirPath?: string, prefix?: string) {
    const fullPath = dirPath || this.config.source;

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
        library[dirName] = deepMerge(library[dirName], this.gatherPrompts(path.join(fullPath, dirName), dirName));
      } else if (isJsFile) {
        const promptModule = require(itemPath);

        const promptsInThisModule = {
          ...promptModule.default,
          ...promptModule,
        };

        delete promptsInThisModule.default;

        if (isIndex) {
          library = deepMerge(library, promptsInThisModule);
        } else {
          const prop = item.replace('.' + extension, '');
          library[prop] = deepMerge(library[prop] || {}, promptsInThisModule);
        }
      }
    }

    return library;
  }

  getAllOutputsFromPrompt(rawPrompt: string) {
    console.log({ rawPrompt });
    const regex = /\{\{([^}]+)\}\}/;
    const arrayOfVarNames = (rawPrompt.match(/\{\{([^}]+)\}\}/g) || []).map((match: any) => match?.match(regex)[1]);
    const obj: any = {};

    arrayOfVarNames.forEach((varName: string) => {
      obj[varName] = true;
    });
    return Object.keys(obj);
  }

  use(prompt: string, inputs: any) {
    const outputs = this.getAllOutputsFromPrompt(prompt);
    if (!outputs.length) {
      console.log('no outputs', prompt);
      return prompt;
    }

    const finalInputs = { inputs };

    for (const output of outputs) {
      const outputValue = _get(this.prompts, output);
      if (!outputValue) {
        continue;
      }
      const outputValueHasOutputs = this.getAllOutputsFromPrompt(outputValue || '').length > 0;
      console.log({ output, outputValue, outputValueHasOutputs });

      if (outputValueHasOutputs) {
        const injected = this.use(outputValue, inputs);
        _set(finalInputs, output, injected);
      } else if (outputValue) {
        _set(finalInputs, output, outputValue);
      }
    }

    const final = LiquidEngine.parseAndRenderSync(prompt, finalInputs);

    console.log({ final, prompt, finalInputs });

    // console.log({ finalInputs, final });
    this.config.debug && console.log(final);

    return final; // TODO all sorts of clean up
  }

  // TODO only pass in the inputs that are needed
  get(promptPath: string, inputs: any) {
    const promptPreInjection = _get(this.prompts, promptPath) || '';
    return this.use(promptPreInjection, inputs);
  }
}

const manager = new PromptManager();

module.exports = manager;

function _get(object: any, dotNotation: string) {
  const keys = (dotNotation || '').split('.');
  let currentObj = object;

  for (const key of keys) {
    if (!currentObj.hasOwnProperty(key)) {
      return undefined;
    }
    currentObj = currentObj[key];
  }

  return currentObj;
}

function _set(object: any, dotNotation: string, value: any) {
  const keys = dotNotation.split('.');
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
