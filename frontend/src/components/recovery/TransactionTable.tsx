import React from "react";
import { ActionBadge } from "../ui/ActionBadge";
import { StatusPill } from "../ui/StatusPill";
import { RecoveryAction } from "../../types";

export interface TransactionRowData {
  paymentId: string;
  timestamp: string;
  method: string;
  bank: string;
  amount: number;
  failureCode: string;
  expectedValue: number;
  action: RecoveryAction;
  status: string;
}

export interface TransactionTableProps {
  transactions?: TransactionRowData[];
  onInspect?: (paymentId: string) => void;
  title?: string;
  subtitle?: string;
}

const defaultTransactions: TransactionRowData[] = [
  {
    paymentId: "pay_9281a182",
    timestamp: "13:04:12.821",
    method: "UPI",
    bank: "HDFC",
    amount: 5200.0,
    failureCode: "BANK_TIMEOUT",
    expectedValue: 416.0,
    action: "RETRY_NOW",
    status: "RECOVERED",
  },
  {
    paymentId: "pay_9282c491",
    timestamp: "13:03:55.109",
    method: "CARD",
    bank: "ICICI",
    amount: 14850.0,
    failureCode: "GATEWAY_504",
    expectedValue: 890.0,
    action: "RETRY_LATER",
    status: "ROUTING",
  },
  {
    paymentId: "pay_9283e710",
    timestamp: "13:03:41.642",
    method: "NET_BANKING",
    bank: "SBI",
    amount: 23000.0,
    failureCode: "INTERNAL_ERROR",
    expectedValue: 120.0,
    action: "SEND_REMINDER",
    status: "PENDING",
  },
  {
    paymentId: "pay_9284f229",
    timestamp: "13:02:18.490",
    method: "UPI",
    bank: "AXIS",
    amount: 850.0,
    failureCode: "INSUFFICIENT_FUNDS",
    expectedValue: 0.0,
    action: "NO_ACTION",
    status: "FAILED",
  },
  {
    paymentId: "pay_9285b611",
    timestamp: "13:01:04.221",
    method: "UPI",
    bank: "HDFC",
    amount: 1950.0,
    failureCode: "NETWORK_CONGESTION",
    expectedValue: 156.0,
    action: "RETRY_NOW",
    status: "RECOVERED",
  },
];

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions = defaultTransactions,
  onInspect,
  title = "Real-Time Payment Failure & Recovery Stream",
  subtitle = "Kafka partitioned stream: recovery.payment.failed",
}) => {
  return (
    <div className="flex flex-col rounded-lg bg-surface-container border border-surface-container-high/60 overflow-hidden">
      <div className="flex items-center justify-between p-space-base border-b border-surface-container-high">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            {title}
          </h3>
          <p className="font-body-sm text-body-sm text-outline">{subtitle}</p>
        </div>
        <div className="flex items-center gap-space-xs font-mono-code text-[11px] text-outline">
          <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
          <span>Live Ingestion Active</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-container-high bg-surface-container-lowest/50 font-label-caps text-label-caps text-outline uppercase tracking-wider">
              <th className="py-space-sm px-space-base">Payment ID</th>
              <th className="py-space-sm px-space-base">Time (IST)</th>
              <th className="py-space-sm px-space-base">Method / Bank</th>
              <th className="py-space-sm px-space-base text-right">Amount (?)</th>
              <th className="py-space-sm px-space-base">Failure Code</th>
              <th className="py-space-sm px-space-base text-right">Expected Value</th>
              <th className="py-space-sm px-space-base">Engine Action</th>
              <th className="py-space-sm px-space-base text-center">Status</th>
              <th className="py-space-sm px-space-base text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high font-mono-code text-body-sm">
            {transactions.map((tx) => (
              <tr
                key={tx.paymentId}
                className="hover:bg-surface-container-high/40 transition-colors"
              >
                <td className="py-space-sm px-space-base font-semibold text-primary">
                  {tx.paymentId}
                </td>
                <td className="py-space-sm px-space-base text-outline text-[11px]">
                  {tx.timestamp}
                </td>
                <td className="py-space-sm px-space-base text-on-surface">
                  <span className="font-medium">{tx.method}</span>
                  <span className="text-outline text-[11px] ml-1">
                    ({tx.bank})
                  </span>
                </td>
                <td className="py-space-sm px-space-base text-right font-semibold text-on-surface tabular-nums">
                  ?{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-space-sm px-space-base text-outline text-[11px]">
                  {tx.failureCode}
                </td>
                <td className="py-space-sm px-space-base text-right text-secondary font-semibold tabular-nums">
                  ?{tx.expectedValue.toFixed(2)}
                </td>
                <td className="py-space-sm px-space-base">
                  <ActionBadge action={tx.action} />
                </td>
                <td className="py-space-sm px-space-base text-center">
                  <StatusPill status={tx.status} />
                </td>
                <td className="py-space-sm px-space-base text-center">
                  <button
                    onClick={() => onInspect?.(tx.paymentId)}
                    className="px-space-xs py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary hover:text-white text-[11px] transition-colors"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;

