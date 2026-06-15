"use client";

import type { AdminCompanyApplicationContract, CompanyApplicationStatus } from "@fp/types";
import { useMemo, useState } from "react";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type CompanyModulesTableProps = {
  action: (formData: FormData) => void | Promise<void>;
  applications: AdminCompanyApplicationContract[];
};

const moduleStatusLabels: Record<CompanyApplicationStatus, string> = {
  active: "Ativo",
  cancelled: "Cancelado",
  implementation: "Em implantacao",
  suspended: "Suspenso"
};

export function CompanyModulesTable({ action, applications }: CompanyModulesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedCount = selectedIds.length;
  const allSelected = applications.length > 0 && selectedCount === applications.length;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? applications.map((application) => application.id) : []);
  }

  function toggleOne(applicationId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, applicationId]));
      }

      return current.filter((id) => id !== applicationId);
    });
  }

  return (
    <form
      action={action}
      className="bulk-modules"
      onSubmit={(event) => {
        if (selectedCount === 0) {
          event.preventDefault();
          return;
        }

        if (!window.confirm(`Aplicar alteracao em ${selectedCount} modulo(s)?`)) {
          event.preventDefault();
        }
      }}
    >
      <div className="bulk-action-bar">
        <strong>{selectedCount} selecionado(s)</strong>
        <label>
          Status
          <select name="status" defaultValue="implementation">
            {Object.entries(moduleStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="bulk-notes">
          Observacoes
          <input maxLength={1000} name="implementationNotes" placeholder="Opcional" />
        </label>
        <PendingSubmitButton disabled={selectedCount === 0} pendingLabel="Aplicando...">
          Aplicar em lote
        </PendingSubmitButton>
      </div>

      <div className="modules-table" role="table" aria-label="Modulos contratados">
        <div className="modules-row modules-row-head" role="row">
          <label className="module-check">
            <input
              checked={allSelected}
              onChange={(event) => toggleAll(event.target.checked)}
              type="checkbox"
            />
            <span>Todos</span>
          </label>
          <span>Modulo</span>
          <span>Status atual</span>
          <span>Observacoes atuais</span>
        </div>

        {applications.map((application) => {
          const checked = selectedIdSet.has(application.id);

          return (
            <div className="modules-row" role="row" key={application.id}>
              <label className="module-check">
                <input
                  checked={checked}
                  name="applicationIds"
                  onChange={(event) => toggleOne(application.id, event.target.checked)}
                  type="checkbox"
                  value={application.id}
                />
                <span>Selecionar</span>
              </label>
              <span>
                <strong>{application.name}</strong>
                <small>{application.description ?? application.key}</small>
              </span>
              <span>
                {application.companyStatus
                  ? moduleStatusLabels[application.companyStatus]
                  : "Nao contratado"}
              </span>
              <span>{application.implementationNotes ?? "Sem observacoes."}</span>
            </div>
          );
        })}
      </div>
    </form>
  );
}
