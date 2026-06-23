"use client";

import { useState } from "react";

type StoreHoursRowProps = {
  allDayLabel?: string;
  closesAt: string;
  defaultClosesAt: string;
  defaultOpensAt: string;
  isActive: boolean;
  isAllDay: boolean;
  label: string;
  nameKey: string;
  opensAt: string;
};

export function StoreHoursRow({
  allDayLabel,
  closesAt,
  defaultClosesAt,
  defaultOpensAt,
  isActive,
  isAllDay,
  label,
  nameKey,
  opensAt
}: StoreHoursRowProps) {
  const [active, setActive] = useState(isActive || isAllDay);
  const [allDay, setAllDay] = useState(isAllDay);
  const [openValue, setOpenValue] = useState(isAllDay ? "00:00" : opensAt || defaultOpensAt);
  const [closeValue, setCloseValue] = useState(isAllDay ? "23:59" : closesAt || defaultClosesAt);

  function toggleAllDay(checked: boolean) {
    setAllDay(checked);

    if (checked) {
      setActive(true);
      setOpenValue("00:00");
      setCloseValue("23:59");
    }
  }

  const effectiveActive = active || allDay;

  return (
    <div className={allDay ? "hours-row all-day" : "hours-row"}>
      <input name="hourKey" type="hidden" value={nameKey} />
      {allDay ? <input name={`isActive:${nameKey}`} type="hidden" value="on" /> : null}

      <label className="hours-toggle">
        <input
          checked={effectiveActive}
          disabled={allDay}
          name={`isActive:${nameKey}`}
          onChange={(event) => setActive(event.target.checked)}
          type="checkbox"
        />
        <span>
          {label}
          <small>{effectiveActive ? `${openValue} ate ${closeValue}` : "Inativo"}</small>
        </span>
      </label>

      {allDayLabel ? (
        <label className="hours-toggle subtle-toggle">
          <input
            checked={allDay}
            name={`isAllDay:${nameKey}`}
            onChange={(event) => toggleAllDay(event.target.checked)}
            type="checkbox"
          />
          <span>
            {allDayLabel}
            <small>Mandante geral</small>
          </span>
        </label>
      ) : (
        <span className="hours-placeholder" aria-hidden="true" />
      )}

      <label>
        Abre
        <input
          disabled={allDay}
          name={`opensAt:${nameKey}`}
          onChange={(event) => setOpenValue(event.target.value)}
          type="time"
          value={openValue}
        />
      </label>
      <label>
        Fecha
        <input
          disabled={allDay}
          name={`closesAt:${nameKey}`}
          onChange={(event) => setCloseValue(event.target.value)}
          type="time"
          value={closeValue}
        />
      </label>
    </div>
  );
}
