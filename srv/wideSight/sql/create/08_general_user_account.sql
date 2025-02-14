-- Table: general.user_account

-- DROP TABLE IF EXISTS general.user_account;

CREATE TABLE IF NOT EXISTS general.user_account
(
    user_email character varying(128) COLLATE pg_catalog."default" NOT NULL,
    account_id uuid NOT NULL,
    CONSTRAINT user_account_pkey PRIMARY KEY (user_email, account_id),
    CONSTRAINT user_account_account_id_fkey FOREIGN KEY (account_id)
        REFERENCES general.account (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT user_account_user_email_fkey FOREIGN KEY (user_email)
        REFERENCES general."user" (email) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

ALTER TABLE IF EXISTS general.user_account
    OWNER to "${authorization_user}";
