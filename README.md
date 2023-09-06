# AI Prompt Organizer

### Super simple and scalable AI prompt management tools

- Access prompts the same way they are organized in your folder/file system
- Use any prompt inside of another prompt
- Easily add variables and logic to your prompts using [Liquid - Shopify's Template Language](https://liquidjs.com/tutorials/intro-to-liquid.html)

### Table of Contents

- [Quick Start](#quick-start)
- [How it works + examples](#how-it-works)

## Quick Start

### 1. Install the package.

```
npm install ai-prompt-organizer
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

## How it works

### File/Module Organization === Prompt Organization
Your prompt library is a directory comprised of other directories and `.cjs` files. 
```
/prompts
  index.cjs
  constants.cjs 
  superLongPrompt.cjs
  /constants <-- Will merge with constants.cjs
    math.cjs
  /formats
    bullets.cjs
    numbered.cjs
    /xml
      statistics.cjs
      listsOfText.cjs

```
### Prompt files have flexible export options
*Currently limited to common/es5 module export system.*

#### 1. Default export an object of prompts
```
<-- prompts/constants.cjs -->

const currencies = {
  USD: "american dollar",
  EUR: "euro"
}

const defaultLanguage = "English"

module.exports = {
  currencies,
  defaultLanguage
}
```

#### 2. Export prompts as named exports
```
<-- prompts/constants/math.cjs -->

module.exports.pi = Math.PI.toFixed(2)

```
#### 3. Export just the prompt
```
<-- prompts/superLongPrompt.cjs -->

module.exports = `
    This is theoretically a super long prompt (maybe as long as all the decimals in pi ({{constants.math.pi}}... etc.)

    So you may want a whole file dedicated to just this prompt.
`

```

### Your file and object/export structures determine how you access your prompts.

Using the `constants` example above...

```
PromptOrganizer.get("constants.defaultLanguage")
// "English"

PromptOrganizer.get("constants.currencies.EUR")
// "euro"

PromptOrganizer.get("constants.math.pi")
// "3.14"

PromptOrganizer.get("superLongPrompt")
// "This is theoretically a super long prompt (maybe as long as all the decimals in pi (3.14... etc.)
//
// So you may want a whole file dedicated to just this prompt."
```

## Examples

### 

```
PromptOrganizer.get("fullPrompt");
// "Hello World!"
```
