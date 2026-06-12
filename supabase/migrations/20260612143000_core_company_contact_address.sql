-- Add normalized mobile phone and structured address fields to companies.

alter table core.companies
  add column primary_mobile_phone text,
  add column address_postal_code text,
  add column address_street_type text,
  add column address_street text,
  add column address_number text,
  add column address_complement text,
  add column address_district text,
  add column address_city text,
  add column address_state text;

alter table core.companies
  add constraint companies_primary_mobile_phone_length_check
    check (primary_mobile_phone is null or char_length(primary_mobile_phone) <= 20),
  add constraint companies_primary_mobile_phone_format_check
    check (primary_mobile_phone is null or primary_mobile_phone ~ '^\+55[0-9]{11}$'),
  add constraint companies_address_postal_code_check
    check (address_postal_code is null or address_postal_code ~ '^[0-9]{8}$'),
  add constraint companies_address_street_type_length_check
    check (address_street_type is null or char_length(address_street_type) <= 40),
  add constraint companies_address_street_length_check
    check (address_street is null or char_length(address_street) <= 160),
  add constraint companies_address_number_length_check
    check (address_number is null or char_length(address_number) <= 20),
  add constraint companies_address_complement_length_check
    check (address_complement is null or char_length(address_complement) <= 120),
  add constraint companies_address_district_length_check
    check (address_district is null or char_length(address_district) <= 120),
  add constraint companies_address_city_length_check
    check (address_city is null or char_length(address_city) <= 120),
  add constraint companies_address_state_check
    check (address_state is null or address_state ~ '^[A-Z]{2}$');

create index companies_address_state_idx
  on core.companies(address_state)
  where deleted_at is null and address_state is not null;

create index companies_address_city_idx
  on core.companies(address_city)
  where deleted_at is null and address_city is not null;
