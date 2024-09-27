# Tech Radar Editor

![NPM Version](https://img.shields.io/npm/v/tech-radar-editor)
![NPM Downloads](https://img.shields.io/npm/dy/tech-radar-editor)

A web component providing an easy-to-use UI that allows users to easily create and edit a Tech Radar without having to directly modify a JSON file. It also adds validation to ensure that your Tech Radar is always in a valid state.

## Who created the Tech Radar?

[ThoughtWorks](https://thoughtworks.com/radar) created the Tech Radar concept, and [Zalando created the visualization](https://opensource.zalando.com/tech-radar/) that is popular today.

### Purpose

Zalando has a fantastic description [on their website](https://opensource.zalando.com/tech-radar/):

> The Tech Radar is a tool to inspire and support engineering teams at Zalando to pick the best technologies for new projects; it provides a platform to share knowledge and experience in technologies, to reflect on technology decisions and continuously evolve our technology landscape. Based on the pioneering work of ThoughtWorks, our Tech Radar sets out the changes in technologies that are interesting in software development — changes that we think our engineering teams should pay attention to and consider using in their projects.

It serves and scales well for teams and companies of all sizes that want to have alignment across dozens of technologies and visualize it in a simple way.

## Include the Component in Spotify Backstage

### Install

For either simple or advanced installations, you'll need to add the dependency using Yarn:

From your Backstage root directory:

```bash
yarn --cwd packages/app add tech-radar-editor
```

### Configuration

Modify your app routes to include the Router component exported from the tech radar, for example:

```tsx
// In packages/app/src/App.tsx
import 'tech-radar-editor';

const routes = (
  <FlatRoutes>
    {/* ...other routes */}
    <Route
      path="/tech-radar-editor"
      element={<tech-radar-editor></tech-radar-editor>}
    />
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

You can then test the package locally.

To publish the component to NPM, run:

```bash
npm login
npm publish
```
