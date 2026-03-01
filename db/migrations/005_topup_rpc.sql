-- Atomic balance increment for YooKassa webhook (avoids race condition on retry)
CREATE OR REPLACE FUNCTION topup_clinic_balance(p_clinic_id uuid, p_amount numeric)
RETURNS void LANGUAGE sql AS $$
  UPDATE clinics SET balance_rub = balance_rub + p_amount WHERE id = p_clinic_id;
$$;
