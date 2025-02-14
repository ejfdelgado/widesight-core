-- List account of a given user
SELECT account.id as id, account.name as name, account.created_at as created_at
FROM general.user_account user_account
INNER JOIN general.account account
ON account.id = user_account.account_id
WHERE user_account.user_email = '${email|sanitizeText}' 
ORDER BY ${orderColumn} ${direction} 
LIMIT ${limit} OFFSET ${offset}