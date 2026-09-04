import React, { useState } from "react";

export interface CodeBlockProps {
  title?: string;
  code: string;
  defaultOpen?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  title = "Machine-Readable Payload (JSON)",
  code,
  defaultOpen = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <details
      className="flex flex-col rounded-lg bg-surface-container-lowest border border-surface-container-high/60 p-space-sm font-mono-code text-[11px] group transition-all"
      open={defaultOpen}
    >
      <summary className="flex items-center justify-between cursor-pointer select-none text-outline group-hover:text-on-surface">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[14px] text-tertiary">
            code
          </span>
          <span className="font-label-caps text-label-caps uppercase">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="px-space-xs py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface text-[10px] transition-colors"
          >
            {copied ? "COPIED" : "COPY"}
          </button>
          <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">
            expand_more
          </span>
        </div>
      </summary>
      <pre className="mt-space-sm p-space-sm rounded bg-surface-container-low text-secondary font-mono-code text-[11px] overflow-x-auto whitespace-pre">
        <code>{code}</code>
      </pre>
    </details>
  );
};

export default CodeBlock;

