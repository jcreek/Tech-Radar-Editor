# Tech Radar Editor

A web component that allows users to easily create and edit a Tech Radar.

## Who created the Tech Radar?

[ThoughtWorks](https://thoughtworks.com/radar) created the Tech Radar concept, and [Zalando created the visualization](https://opensource.zalando.com/tech-radar/) that is popular today.

## Building the Component

To build the component, you need to have Node.js installed. Clone the repository and run the following commands:

```bash
pnpm install
pnpm build
```

To get it ready to add to NPM or a CDN, run:

```bash
pnpm build
pnpm pack
```

To publish the component to NPM, run:

```bash
pnpm publish
```

## Consume the Component in Plain JavaScript

Include the component in an HTML file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Tech Radar Editor</title>
    <script type="module" src="./tech-radar-editor.es.js"></script>
  </head>
  <body>
    <tech-radar-editor></tech-radar-editor>
  </body>
</html>
```

## Consume the Component in React

In a React project, you can use the web component as you would use any custom HTML element.

First, ensure that the component is imported or included:

```js
// index.js
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

// Import the component
import "tech-radar-editor";

function App() {
  return (
    <div className="App">
      <tech-radar-editor></tech-radar-editor>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```

Note: In React, you might need to instruct TypeScript about the custom element. Create a react-app-env.d.ts or a global.d.ts file:

```ts
// react-app-env.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    "tech-radar-editor": any;
  }
}
```
