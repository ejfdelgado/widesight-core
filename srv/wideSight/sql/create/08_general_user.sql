-- Create user
CREATE TABLE IF NOT EXISTS general."user"
(
    email character varying(128) COLLATE pg_catalog."default" NOT NULL,
    name character varying(515) COLLATE pg_catalog."default",
    created_time timestamp without time zone,
    created_at bigint,
    CONSTRAINT user_pkey PRIMARY KEY (email)
);

ALTER TABLE IF EXISTS general.user
    OWNER to "${authorization_user}";