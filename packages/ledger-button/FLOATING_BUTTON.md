# Floating Button Customization

The Ledger Button package now supports customizable positioning for the floating action button.

## Usage

### Basic Usage with Default Position

By default, the floating button appears at the bottom-right corner:

```typescript
import { initializeLedgerProvider } from '@ledgerhq/ledger-wallet-provider';

const cleanup = initializeLedgerProvider({
  apiKey: 'your-api-key',
  dAppIdentifier: 'your-dapp-identifier',
  environment: 'production',
  // floatingButtonPosition defaults to 'bottom-right'
});
```

### Custom Position

You can customize the position using the `floatingButtonPosition` option:

```typescript
import { initializeLedgerProvider } from '@ledgerhq/ledger-wallet-provider';

const cleanup = initializeLedgerProvider({
  apiKey: 'your-api-key',
  dAppIdentifier: 'your-dapp-identifier',
  environment: 'production',
  floatingButtonPosition: 'top-left', // or any other position
});
```

### Available Positions

The following positions are supported:

- `'bottom-right'` (default)
- `'bottom-left'`
- `'bottom-center'`
- `'top-right'`
- `'top-left'`
- `'top-center'`
- `false` (hides the floating button entirely)

### Hide Floating Button

To hide the floating button completely:

```typescript
const cleanup = initializeLedgerProvider({
  apiKey: 'your-api-key',
  dAppIdentifier: 'your-dapp-identifier',
  environment: 'production',
  floatingButtonPosition: false,
});
```

### Custom Container Target

You can render the floating button inside a specific container element using `floatingButtonTarget`. This is useful if you want to control the button's scope or integrate it within a specific part of your UI.

**Important:** When using `floatingButtonTarget`, the button automatically switches to a **compact variant** - a pill-shaped button with the Ledger logo and text label. This design is more suitable for embedded contexts.

```typescript
// Using a CSS selector
const cleanup = initializeLedgerProvider({
  apiKey: 'your-api-key',
  dAppIdentifier: 'your-dapp-identifier',
  environment: 'production',
  floatingButtonTarget: '#my-custom-container',
});

// Or using an HTMLElement reference
const container = document.getElementById('my-custom-container');
const cleanup = initializeLedgerProvider({
  apiKey: 'your-api-key',
  dAppIdentifier: 'your-dapp-identifier',
  environment: 'production',
  floatingButtonTarget: container,
});
```

**Variants:**

- **Without target (default):** Large circular button with just the Ledger icon, fixed positioned on screen
- **With target:** Compact pill-shaped button with Ledger icon + "Ledger" text label, rendered inside the specified container

**Note:** When `floatingButtonTarget` is provided, it takes precedence over `floatingButtonPosition`.

### Example: Custom Container HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My dApp</title>
    <style>
      #wallet-section {
        position: relative;
        width: 300px;
        height: 400px;
        border: 1px solid #ccc;
        margin: 20px;
      }
    </style>
  </head>
  <body>
    <div id="wallet-section">
      <h2>Wallet Area</h2>
      <p>The floating button will appear here</p>
    </div>

    <script type="module">
      import { initializeLedgerProvider } from "@ledgerhq/ledger-wallet-provider";

      initializeLedgerProvider({
        apiKey: "your-api-key",
        dAppIdentifier: "your-dapp-identifier",
        environment: "production",
        floatingButtonTarget: "#wallet-section",
      });
    </script>
  </body>
</html>
```

## TypeScript Types

The package exports the `FloatingButtonPosition` type:

```typescript
import type {
  FloatingButtonPosition,
  InitializeLedgerProviderOptions
} from '@ledgerhq/ledger-wallet-provider';

type FloatingButtonPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | false;
```

## Behavior

- The floating button only appears when a user is connected (has selected an account)
- The button is hidden when the modal is open
- Clicking the button triggers the account selection flow
- The button has a fixed z-index of 1000 to ensure it stays on top of most content
- The button includes hover and active states with smooth transitions
