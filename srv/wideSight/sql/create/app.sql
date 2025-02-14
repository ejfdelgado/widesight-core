-- Inser app
INSERT INTO
    $ { schemaId }.app(name, account_id)
VALUES
    (
        '${name|sanitizeText}',
        '${accountId|sanitizeText}'
    );