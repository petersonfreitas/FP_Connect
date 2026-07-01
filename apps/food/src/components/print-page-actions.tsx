"use client";

type PrintPageActionsProps = {
  backHref: string;
};

export function PrintPageActions({ backHref }: PrintPageActionsProps) {
  return (
    <div className="print-actions no-print">
      <a className="secondary-action compact-action" href={backHref}>
        Voltar
      </a>
      <button className="primary-action compact-action" onClick={() => window.print()} type="button">
        Imprimir
      </button>
    </div>
  );
}
