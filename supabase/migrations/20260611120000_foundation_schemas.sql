-- FP Connect foundation schemas.
-- Single Supabase/PostgreSQL database, separated by module schemas.

create schema if not exists core;
create schema if not exists robots;
create schema if not exists food;
create schema if not exists tracking;
create schema if not exists marketing;
create schema if not exists sales;
create schema if not exists tickets;
create schema if not exists billing;

comment on schema core is
  'FP Connect core schema: companies, profiles, memberships, module catalog, contracted modules, permissions, audit and authorization helpers.';

comment on schema robots is
  'FP Robots schema: events, outbox, automations, connectors, executions, logs and reprocessing.';

comment on schema food is
  'FP Food schema: stores, menus, products, carts, orders, kitchen flow, manual payments and delivery integration.';

comment on schema tracking is
  'FP Tracking schema: deliveries, drivers, vehicles, routes, location updates, occurrences and public tracking links.';

comment on schema marketing is
  'FP Marketing schema: campaigns, channels, leads, qualification, planned actions, content and conversion to Sales.';

comment on schema sales is
  'FP Sales schema: prospects, customers, contacts, opportunities, proposals, activities, pipeline and customer 360.';

comment on schema tickets is
  'FP Tickets schema: tickets, categories, priorities, queues, responses, attachments, SLA and onboarding.';

comment on schema billing is
  'FP Billing schema: plans, subscriptions, contracted modules, charges, payments, receipts and financial status.';
