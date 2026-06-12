"use client";

import type { AdminRoleContract, AdminUserApplicationRoleContract } from "@fp/types";
import { useMemo, useState } from "react";

type UserRolesTableProps = {
  availableRoles: AdminRoleContract[];
  grants: AdminUserApplicationRoleContract[];
  grantAction: (formData: FormData) => void | Promise<void>;
  revokeAction: (formData: FormData) => void | Promise<void>;
};

export function UserRolesTable({
  availableRoles,
  grants,
  grantAction,
  revokeAction
}: UserRolesTableProps) {
  const grantedRoleIds = useMemo(() => new Set(grants.map((grant) => grant.roleId)), [grants]);
  const grantableRoles = useMemo(
    () => availableRoles.filter((role) => !grantedRoleIds.has(role.id)),
    [availableRoles, grantedRoleIds]
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedGrantIds, setSelectedGrantIds] = useState<string[]>([]);
  const selectedRoleIdSet = useMemo(() => new Set(selectedRoleIds), [selectedRoleIds]);
  const selectedGrantIdSet = useMemo(() => new Set(selectedGrantIds), [selectedGrantIds]);
  const allRolesSelected =
    grantableRoles.length > 0 && selectedRoleIds.length === grantableRoles.length;
  const allGrantsSelected = grants.length > 0 && selectedGrantIds.length === grants.length;

  function toggleAllRoles(checked: boolean) {
    setSelectedRoleIds(checked ? grantableRoles.map((role) => role.id) : []);
  }

  function toggleOneRole(roleId: string, checked: boolean) {
    setSelectedRoleIds((current) => toggleListValue(current, roleId, checked));
  }

  function toggleAllGrants(checked: boolean) {
    setSelectedGrantIds(checked ? grants.map((grant) => grant.id) : []);
  }

  function toggleOneGrant(grantId: string, checked: boolean) {
    setSelectedGrantIds((current) => toggleListValue(current, grantId, checked));
  }

  return (
    <div className="role-management">
      <form
        action={grantAction}
        className="bulk-modules"
        onSubmit={(event) => {
          if (selectedRoleIds.length === 0) {
            event.preventDefault();
            return;
          }

          if (!window.confirm(`Conceder ${selectedRoleIds.length} papel(eis)?`)) {
            event.preventDefault();
          }
        }}
      >
        <div className="bulk-action-bar role-action-bar">
          <strong>{selectedRoleIds.length} selecionado(s)</strong>
          <span>Disponiveis para concessao</span>
          <button className="primary-action" disabled={selectedRoleIds.length === 0} type="submit">
            Conceder em lote
          </button>
        </div>

        {grantableRoles.length > 0 ? (
          <div className="modules-table" role="table" aria-label="Papeis disponiveis">
            <div className="modules-row roles-row modules-row-head" role="row">
              <label className="module-check">
                <input
                  checked={allRolesSelected}
                  onChange={(event) => toggleAllRoles(event.target.checked)}
                  type="checkbox"
                />
                <span>Todos</span>
              </label>
              <span>Papel</span>
              <span>Modulo</span>
              <span>Permissoes</span>
            </div>

            {grantableRoles.map((role) => {
              const checked = selectedRoleIdSet.has(role.id);

              return (
                <div className="modules-row roles-row" role="row" key={role.id}>
                  <label className="module-check">
                    <input
                      checked={checked}
                      name="roleIds"
                      onChange={(event) => toggleOneRole(role.id, event.target.checked)}
                      type="checkbox"
                      value={role.id}
                    />
                    <span>Selecionar</span>
                  </label>
                  <span>
                    <strong>{role.name}</strong>
                    <small>{role.description ?? role.key}</small>
                  </span>
                  <span>{role.applicationName}</span>
                  <span>{formatPermissions(role)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            Nenhum papel disponivel para concessao. Os papeis ativos ja foram concedidos ou nao ha
            modulos aptos.
          </div>
        )}
      </form>

      <form
        action={revokeAction}
        className="bulk-modules"
        onSubmit={(event) => {
          if (selectedGrantIds.length === 0) {
            event.preventDefault();
            return;
          }

          if (!window.confirm(`Revogar ${selectedGrantIds.length} papel(eis)?`)) {
            event.preventDefault();
          }
        }}
      >
        <div className="bulk-action-bar role-action-bar">
          <strong>{selectedGrantIds.length} selecionado(s)</strong>
          <span>Papeis concedidos</span>
          <button
            className="secondary-action"
            disabled={selectedGrantIds.length === 0}
            type="submit"
          >
            Revogar em lote
          </button>
        </div>

        {grants.length > 0 ? (
          <div className="modules-table" role="table" aria-label="Papeis concedidos">
            <div className="modules-row roles-row modules-row-head" role="row">
              <label className="module-check">
                <input
                  checked={allGrantsSelected}
                  onChange={(event) => toggleAllGrants(event.target.checked)}
                  type="checkbox"
                />
                <span>Todos</span>
              </label>
              <span>Papel</span>
              <span>Modulo</span>
              <span>Chave</span>
            </div>

            {grants.map((grant) => {
              const checked = selectedGrantIdSet.has(grant.id);

              return (
                <div className="modules-row roles-row" role="row" key={grant.id}>
                  <label className="module-check">
                    <input
                      checked={checked}
                      name="grantIds"
                      onChange={(event) => toggleOneGrant(grant.id, event.target.checked)}
                      type="checkbox"
                      value={grant.id}
                    />
                    <span>Selecionar</span>
                  </label>
                  <span>
                    <strong>{grant.roleName}</strong>
                    <small>{grant.roleKey}</small>
                  </span>
                  <span>{grant.applicationName}</span>
                  <span>{grant.applicationKey}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">Nenhum papel concedido para este usuario ainda.</div>
        )}
      </form>
    </div>
  );
}

function toggleListValue(current: string[], value: string, checked: boolean): string[] {
  if (checked) {
    return Array.from(new Set([...current, value]));
  }

  return current.filter((item) => item !== value);
}

function formatPermissions(role: AdminRoleContract): string {
  if (role.permissions.length === 0) {
    return "Sem permissoes vinculadas";
  }

  return role.permissions.map((permission) => permission.name).join(", ");
}
