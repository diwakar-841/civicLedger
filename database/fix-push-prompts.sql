BEGIN;

-- Keep one row for each member pair if duplicates already exist.
DELETE FROM public.group_members AS duplicate
USING public.group_members AS keeper
WHERE duplicate.group_id = keeper.group_id
  AND duplicate.user_id = keeper.user_id
  AND duplicate.id > keeper.id;

-- Keep the newest request for each group/user pair if duplicates already exist.
DELETE FROM public.group_requests AS duplicate
USING public.group_requests AS keeper
WHERE duplicate.group_id = keeper.group_id
  AND duplicate.user_id = keeper.user_id
  AND (
    duplicate.created_at < keeper.created_at
    OR (duplicate.created_at = keeper.created_at AND duplicate.id < keeper.id)
  );

-- Replace differently named constraints/indexes with the exact names in schema/groups.ts.
ALTER TABLE public.group_members
  DROP CONSTRAINT IF EXISTS group_members_group_user_unique,
  DROP CONSTRAINT IF EXISTS group_members_group_id_user_id_unique;
DROP INDEX IF EXISTS public.group_members_group_user_unique;
DROP INDEX IF EXISTS public.group_members_group_id_user_id_unique;
DROP INDEX IF EXISTS public.group_members_group_id_user_id_index;
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_group_user_unique UNIQUE (group_id, user_id);

ALTER TABLE public.group_requests
  DROP CONSTRAINT IF EXISTS group_requests_group_user_unique,
  DROP CONSTRAINT IF EXISTS group_requests_group_id_user_id_unique;
DROP INDEX IF EXISTS public.group_requests_group_user_unique;
DROP INDEX IF EXISTS public.group_requests_group_id_user_id_unique;
DROP INDEX IF EXISTS public.group_requests_group_id_user_id_index;
ALTER TABLE public.group_requests
  ADD CONSTRAINT group_requests_group_user_unique UNIQUE (group_id, user_id);

COMMIT;
