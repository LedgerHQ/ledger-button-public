import { ledgerButtonCore } from "@ledgerhq/ledger-button-core";
import { LedgerButtonUi } from "@ledgerhq/ledger-button-ui";

import styles from "./ledger-button.module.css";

console.log(ledgerButtonCore);

export function LedgerButton() {
  return (
    <div className={styles["container"]}>
      <h1>Welcome to LedgerButton!</h1>
      <LedgerButtonUi />
    </div>
  );
}

export default LedgerButton;
