-- Add company person type and explicit field length/document constraints.

do $$
begin
  create type core.company_person_type as enum ('individual', 'legal_entity');
exception
  when duplicate_object then null;
end;
$$;

alter table core.companies
  add column if not exists person_type core.company_person_type not null default 'legal_entity';

alter table core.companies
  alter column person_type set not null;

alter table core.companies
  add constraint companies_legal_name_length_check
    check (char_length(legal_name) between 1 and 180),
  add constraint companies_trade_name_length_check
    check (trade_name is null or char_length(trade_name) <= 140),
  add constraint companies_document_length_check
    check (document is null or char_length(document) <= 14),
  add constraint companies_document_person_type_check
    check (
      document is null
      or (person_type = 'individual' and document ~ '^[0-9]{11}$')
      or (person_type = 'legal_entity' and document ~ '^[0-9]{14}$')
    ),
  add constraint companies_primary_email_length_check
    check (primary_email is null or char_length(primary_email) <= 254),
  add constraint companies_primary_phone_length_check
    check (primary_phone is null or char_length(primary_phone) <= 20),
  add constraint companies_primary_responsible_name_length_check
    check (char_length(primary_responsible_name) between 1 and 140),
  add constraint companies_primary_responsible_email_length_check
    check (primary_responsible_email is null or char_length(primary_responsible_email) <= 254),
  add constraint companies_implementation_notes_length_check
    check (implementation_notes is null or char_length(implementation_notes) <= 1000);

comment on column core.companies.person_type is
  'Company person type: individual for CPF/persona fisica, legal_entity for CNPJ/persona juridica.';
