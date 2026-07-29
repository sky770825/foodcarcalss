-- Persist the 24-hour payment deadline in the database instead of relying on an open admin browser.
CREATE OR REPLACE FUNCTION public.expire_overdue_foodcarcalss_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.foodcarcalss
  SET payment = '逾繳可排'
  WHERE COALESCE(BTRIM(payment), '') IN ('', '尚未付款', '未付款')
    AND COALESCE("timestamp", created_at) < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_overdue_foodcarcalss_bookings() FROM PUBLIC;

-- Supabase Cron is enabled by this extension and runs the status transition every five minutes.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  FOR existing_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'expire-overdue-foodcarcalss-bookings'
  LOOP
    PERFORM cron.unschedule(existing_job_id);
  END LOOP;

  PERFORM cron.schedule(
    'expire-overdue-foodcarcalss-bookings',
    '*/5 * * * *',
    'SELECT public.expire_overdue_foodcarcalss_bookings();'
  );
END;
$$;
