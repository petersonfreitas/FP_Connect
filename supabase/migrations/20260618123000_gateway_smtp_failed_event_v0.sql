insert into robots.event_catalog (
  code,
  source_application_key,
  name,
  description,
  version,
  status
)
values (
  'gateway.smtp.test_email_failed',
  'gateway',
  'E-mail SMTP de teste falhou',
  'Emitido quando o FP Gateway nao consegue enviar um e-mail de teste usando a configuracao SMTP da empresa.',
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
