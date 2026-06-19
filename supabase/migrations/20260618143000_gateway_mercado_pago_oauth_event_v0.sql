insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values (
  'gateway.mercado_pago.oauth_connected',
  'gateway',
  'Mercado Pago conectado por OAuth',
  'Emitido quando uma empresa autoriza a integracao Mercado Pago no FP Gateway via OAuth.',
  1,
  'active'
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  status = excluded.status,
  deleted_at = null,
  updated_at = now();
