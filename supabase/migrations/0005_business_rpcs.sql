-- ============================================================
-- Veloop — RPC métier (SECURITY DEFINER, autorisations internes)
-- Centralise les mutations transverses (assignation, statut, paiement,
-- validation) pour fonctionner sous RLS sans clé service_role.
-- ============================================================

-- Chauffeurs validés visibles par tout utilisateur connecté (dispatch + fiches).
create policy driver_profiles_approved_visible on public.driver_profiles
  for select using (auth.role() = 'authenticated' and approval_status = 'approved');

create or replace function public.assign_ride_driver(p_ride_id uuid, p_driver_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.ride_requests;
begin
  select * into r from public.ride_requests where id = p_ride_id;
  if not found then raise exception 'ride not found'; end if;
  if not (public.is_admin() or r.customer_id = auth.uid() or p_driver_id = auth.uid()) then
    raise exception 'not authorized'; end if;
  update public.ride_requests set driver_id = p_driver_id, status = 'driver_assigned', updated_at = now() where id = p_ride_id;
  insert into public.ride_status_history (ride_id, status, changed_by) values (p_ride_id, 'driver_assigned', auth.uid());
  perform public.create_notification(r.customer_id, 'Chauffeur trouvé', 'Un chauffeur a accepté votre course.', 'ride');
  perform public.create_notification(p_driver_id, 'Course attribuée', 'Une course vous a été attribuée.', 'driver');
end; $$;

create or replace function public.update_ride_status(p_ride_id uuid, p_status ride_status)
returns void language plpgsql security definer set search_path = public as $$
declare r public.ride_requests;
begin
  select * into r from public.ride_requests where id = p_ride_id;
  if not found then raise exception 'ride not found'; end if;
  if not (public.is_admin() or r.driver_id = auth.uid() or r.customer_id = auth.uid()) then
    raise exception 'not authorized'; end if;
  update public.ride_requests
    set status = p_status, updated_at = now(),
        final_price = case when p_status = 'trip_completed' then estimated_price else final_price end
    where id = p_ride_id;
  insert into public.ride_status_history (ride_id, status, changed_by) values (p_ride_id, p_status, auth.uid());
  perform public.create_notification(r.customer_id, 'Mise à jour de votre course',
    'Nouveau statut : ' || replace(p_status::text, '_', ' '), 'ride');
  if p_status = 'trip_completed' then
    insert into public.payments (ride_id, customer_id, amount, currency, status, stripe_payment_intent_id)
      values (p_ride_id, r.customer_id, r.estimated_price, 'EUR', 'paid', 'demo_pi_' || p_ride_id)
      on conflict (ride_id) do update set status = 'paid', amount = excluded.amount, updated_at = now();
    perform public.create_notification(r.customer_id, 'Paiement confirmé', 'Votre paiement a été confirmé.', 'payment');
    if r.driver_id is not null then
      update public.driver_profiles set completed_trips = completed_trips + 1 where user_id = r.driver_id;
    end if;
  end if;
end; $$;

create or replace function public.cancel_ride(p_ride_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.ride_requests;
begin
  select * into r from public.ride_requests where id = p_ride_id;
  if not found then raise exception 'ride not found'; end if;
  if not (public.is_admin() or r.driver_id = auth.uid() or r.customer_id = auth.uid()) then
    raise exception 'not authorized'; end if;
  update public.ride_requests set status = 'cancelled', cancellation_reason = p_reason, updated_at = now() where id = p_ride_id;
  insert into public.ride_status_history (ride_id, status, changed_by) values (p_ride_id, 'cancelled', auth.uid());
  perform public.create_notification(r.customer_id, 'Course annulée', 'Votre course a été annulée.', 'ride');
  if r.driver_id is not null then
    perform public.create_notification(r.driver_id, 'Course annulée', 'Une de vos courses a été annulée.', 'driver');
  end if;
end; $$;

create or replace function public.set_driver_approval(p_user_id uuid, p_status approval_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.driver_profiles set approval_status = p_status, updated_at = now() where user_id = p_user_id;
  if p_status = 'approved' then
    update public.driver_documents set verification_status = 'approved' where driver_id = p_user_id;
    perform public.create_notification(p_user_id, 'Compte validé', 'Votre profil chauffeur Veloop a été validé. Vous pouvez passer en ligne.', 'document');
  elsif p_status = 'rejected' then
    perform public.create_notification(p_user_id, 'Profil refusé', coalesce(p_reason, 'Votre profil chauffeur n''a pas été validé.'), 'document');
  end if;
end; $$;

create or replace function public.upsert_payment(p_ride_id uuid, p_customer_id uuid, p_amount numeric, p_status payment_status, p_intent text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or exists (select 1 from public.ride_requests r where r.id = p_ride_id and (r.customer_id = auth.uid() or r.driver_id = auth.uid()))) then
    raise exception 'not authorized'; end if;
  insert into public.payments (ride_id, customer_id, amount, currency, status, stripe_payment_intent_id)
    values (p_ride_id, p_customer_id, p_amount, 'EUR', p_status, coalesce(p_intent, 'demo_pi_' || p_ride_id))
    on conflict (ride_id) do update set amount = excluded.amount, status = excluded.status, stripe_payment_intent_id = excluded.stripe_payment_intent_id, updated_at = now();
end; $$;

revoke all on function public.assign_ride_driver(uuid, uuid) from public, anon;
revoke all on function public.update_ride_status(uuid, ride_status) from public, anon;
revoke all on function public.cancel_ride(uuid, text) from public, anon;
revoke all on function public.set_driver_approval(uuid, approval_status, text) from public, anon;
revoke all on function public.upsert_payment(uuid, uuid, numeric, payment_status, text) from public, anon;
grant execute on function public.assign_ride_driver(uuid, uuid) to authenticated;
grant execute on function public.update_ride_status(uuid, ride_status) to authenticated;
grant execute on function public.cancel_ride(uuid, text) to authenticated;
grant execute on function public.set_driver_approval(uuid, approval_status, text) to authenticated;
grant execute on function public.upsert_payment(uuid, uuid, numeric, payment_status, text) to authenticated;
