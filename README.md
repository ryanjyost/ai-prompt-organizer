# AI Prompt Organizer

### Super simple and scalable AI prompt management tools

- Access prompts the same way they are organized in your folder/file system
- Use any prompt inside of another prompt
- Easily add variables and logic to your prompts using [Liquid - Shopify's Template Language](https://liquidjs.com/tutorials/intro-to-liquid.html)

### Table of Contents

- Quick Start

## [Quick Start](#quick-start)

### 1. Install the package.

```
npm i ai-prompt-organizer
```

### 2. Create a `prompts` directory in the root of your project. Add an `index.cjs` file.

```
mkdir prompts
cd prompts
touch index.cjs
```

_Not sure what `.cjs` is? [Leare more here](https://codingforseo.com/blog/mjs-vs-cjs-files/)_

### 3. In `index.cjs`, default export an object of prompts.

```
module.exports = {
    hello: "Hello world!"
}
```

NOTE: Right now, common js modules are required to accomodate older Node projects.

### 4. Use your prompts!

```
import PromptOrganizer from "ai-prompt-organizer"

const prompt = PromptOrganizer.get("hello")
// Output: "Hello world!"
```

## Examples
