-- Destroy account 
DO $$
DECLARE
    user_account_exists BOOLEAN;
BEGIN

    DROP TABLE IF EXISTS ${schemaId}.media_tag;

    DROP TABLE IF EXISTS ${schemaId}.object;

    DROP TABLE IF EXISTS ${schemaId}.app_media;

    DROP TABLE IF EXISTS ${schemaId}.media;

    DROP TABLE IF EXISTS ${schemaId}.note;

    DROP TABLE IF EXISTS ${schemaId}.summary;

    DROP TABLE IF EXISTS ${schemaId}.app;

    -- Drop the schema...
    DROP SCHEMA IF EXISTS ${schemaId} CASCADE;

    DELETE FROM general.user_account WHERE account_id = '${account_id}';

    DELETE FROM general.account WHERE id = '${account_id}';
END;
$$ LANGUAGE plpgsql;