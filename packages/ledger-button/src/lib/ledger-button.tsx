import styles from "./ledger-button.module.css";
import { LedgerButtonUi } from "@ledgerhq/ledger-button-ui";

export function LedgerButton() {
  return (
    <div className={styles["container"]}>
      <h1>Welcome to LedgerButton!</h1>
      <LedgerButtonUi />
    </div>
  );
}

export default LedgerButton;
