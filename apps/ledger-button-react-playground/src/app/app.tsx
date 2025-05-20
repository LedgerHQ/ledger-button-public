// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { LedgerButton } from "@ledgerhq/ledger-button";

import NxWelcome from "./nx-welcome";

export function App() {
  return (
    <div>
      <NxWelcome title="@ledgerhq/ledger-button-react-playground" />
      <LedgerButton />
    </div>
  );
}

export default App;
