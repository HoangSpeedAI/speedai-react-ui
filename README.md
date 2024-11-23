# Speed AI React Components

A collection of reusable React components for building AI-powered user interfaces.

## Installation

To install the dependencies, run the following command in both the root directory and the `example` directory:

```
npm install
```

## Building the Package

To build the package, run:

```
npm run build
```

## Local Development and Testing

Follow these steps to test the package locally:

1. From the root directory, ensure you're using the same React version:

   ```
   npm link "./example/node_modules/react"
   npm link
   ```

2. Verify that the `speedai-react-ui` package is linked properly:

   ```
   npm ls --location=global --depth=0 --link=true
   ```

3. Navigate to the `example` directory and link the package:

   ```
   cd example
   npm link speedai-react-ui
   ```

4. Build and run the test page:

   ```
   npm run dev
   ```

## Features

- [List key features of your component library]

## Usage

```jsx
import { FloatingChatBox } from 'speedai-react-ui';

function App() {
  return <FloatingChatBox />;
}
```

## Documentation

For detailed documentation and examples, please visit [link to your documentation].

<!-- ## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details. -->

## License

This project is licensed under the [MIT License](LICENSE).