SELECT
    app.id as id,
    app.name as name
FROM
    $ { schemaId }.app app
WHERE
    app.account_id = '${accountId | sanitizeText}';