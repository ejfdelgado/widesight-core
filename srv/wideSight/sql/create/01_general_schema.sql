CREATE SCHEMA IF NOT EXISTS general AUTHORIZATION "${authorization_user}";

-- enable uuid creation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";