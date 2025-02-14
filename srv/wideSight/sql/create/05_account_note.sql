

CREATE TABLE IF NOT EXISTS ${schemaId}.note
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    media_id uuid NOT NULL,
    media_type character varying(8) COLLATE pg_catalog."default" NOT NULL,
    media_source_url character varying(2048) COLLATE pg_catalog."default",
    media_start_at timestamp without time zone,
    media_start_time bigint,
    media_end_at timestamp without time zone,
    media_end_time bigint,
    created_at timestamp without time zone,
    created_time bigint,
    speaker character varying(16) COLLATE pg_catalog."default" NOT NULL,
    title character varying(1024) COLLATE pg_catalog."default",
    text text COLLATE pg_catalog."default",
    app_id uuid NOT NULL,
    app_name character varying(512) COLLATE pg_catalog."default",
    account_id uuid NOT NULL,
    account_name character varying(128) COLLATE pg_catalog."default",
    CONSTRAINT note_pkey PRIMARY KEY (id),
    CONSTRAINT note_app_fk FOREIGN KEY (app_id)
        REFERENCES ${schemaId}.app (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT note_account_fk FOREIGN KEY (account_id)
        REFERENCES general.account (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS ${schemaId}.object
    OWNER to "${authorization_user}";
