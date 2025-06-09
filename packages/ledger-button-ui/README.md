# Ledger Button UI

Lit.dev web component with Tailwind CSS styling.

## Usage

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./dist/index.js"></script>
  </head>
  <body>
    <ledger-button-ui></ledger-button-ui>

    <script>
      document.addEventListener("ledger-button-click", (e) => {
        console.log("Button clicked:", e.detail);
      });
    </script>
  </body>
</html>
```
