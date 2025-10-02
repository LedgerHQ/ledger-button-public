export interface InvoicingEventData {
  transactionType: "ETH_transfer" | "ERC-20_approve";
  sourceToken: string;
  targetToken: string;
  recipientAddress: string;
  transactionAmount: string;
}