# AI Prompt Organizer

### Super simple and scalable AI prompt management tools

- Access prompts the same way they are organized in your folder/file system
- Use any prompt inside of another prompt.
- Easily add variables and logic to your prompts using [Liquid - Shopify's Template Language](https://liquidjs.com/tutorials/intro-to-liquid.html)

### Table of Contents

- [Quick Start](#quick-start)
- [Examples](#examples)

## Quick Start

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
    greetings: {
    hello: "Hi GPT!",
    poseQuestion: "I have a question.",
  },
  respondInStyle: "Write your response in the style of",
  writingStyles: {
    mobster: "a mobster from the 1920s",
    celebs: {
      misterRogers: "Mr. Rogers",
    },
  },
  ageAppropriate:
    "{{important}} Make your response appropriate for someone who is {{inputs.age}} years old.",
  fullPrompt: `
    {{greetings.hello}} {{greetings.poseQuestion}}
    {{inputs.question}}
    {{respondInStyle}} {{writingStyles.celebs.misterRogers}}.
    {{ageAppropriate}}
    `

}
```

NOTE: Right now, common js modules are required to accomodate older Node projects.

### 4. Use your prompts!

```
import PromptOrganizer from "ai-prompt-organizer"

const inputs = { question: "Why do zebras have stripes?", age: 10 };
const prompt = PromptOrganizer.get("fullPrompt", inputs)

console.log(prompt)
// Hi GPT! I have a question.
// Why do zebras have stripes?
// Write your response in the style of Mr. Rogers.
// IMPORTANT! Make your response appropriate for someone who is 10 years old.
```

## Examples

```
PromptOrganizer.get("fullPrompt");
// "Hello World!"
```
