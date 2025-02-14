-- Account

CREATE TABLE IF NOT EXISTS general.account
(
    id uuid,
    name character varying(128),
    email character varying(128) NOT NULL,
    created_time timestamp without time zone,
    created_at bigint,
    PRIMARY KEY (id)
);
END;
