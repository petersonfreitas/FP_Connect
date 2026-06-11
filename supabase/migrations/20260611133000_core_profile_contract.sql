-- Add explicit profile field length constraints for Admin Console forms.

alter table core.profiles
  add constraint profiles_full_name_length_check
    check (char_length(full_name) between 1 and 140),
  add constraint profiles_email_length_check
    check (email is null or char_length(email) <= 254);
