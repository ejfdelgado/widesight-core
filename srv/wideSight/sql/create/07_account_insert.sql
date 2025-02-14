-- Insert account created

DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
    SELECT 1
    FROM general.user
    WHERE email = '${account_email|sanitizeText}'
    ) INTO user_exists;

    IF NOT user_exists THEN
        INSERT INTO general.user(email, name, created_at, created_time)
        VALUES (
            '${account_email|sanitizeText}', 
            '${account_email|sanitizeText}', 
            $ { now },
            TO_TIMESTAMP($ { now } / 1000)
            );
    END IF;

    INSERT INTO
        general.account(id, name, email, created_at, created_time)
    VALUES
        (
            '${account_id}',
            '${account_name|sanitizeText}',
            '${account_email|sanitizeText}',
            $ { now },
            TO_TIMESTAMP($ { now } / 1000)
        );
    
    -- Relate user with account
    INSERT INTO
        general.user_account(user_email, account_id)
    VALUES
        (
            '${account_email|sanitizeText}',
            '${account_id|sanitizeText}'
        );
END;
$$ LANGUAGE plpgsql;