-- App

CREATE TABLE IF NOT EXISTS ${schemaId}.app
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying(512) COLLATE pg_catalog."default",
    account_id uuid NOT NULL,
    created_time timestamp without time zone,
    created_at bigint,
    CONSTRAINT app_pkey PRIMARY KEY (id),
    CONSTRAINT app_account_fk FOREIGN KEY (account_id)
        REFERENCES general.account (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS ${schemaId}.app
    OWNER to "${authorization_user}";
