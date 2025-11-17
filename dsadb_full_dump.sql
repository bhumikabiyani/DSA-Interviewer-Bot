--
-- PostgreSQL database dump
--

\restrict aBETxX7vksH8e5zjLe9FhY2rEHEGABVNSja1myl3FMg22RpbT3XIwVj2QomOuj0

-- Dumped from database version 15.15 (Homebrew)
-- Dumped by pg_dump version 15.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: dsa_bot_schema; Type: SCHEMA; Schema: -; Owner: sujalvijay
--

CREATE SCHEMA dsa_bot_schema;


-- ALTER SCHEMA dsa_bot_schema OWNER TO sujalvijay;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: dsa_bot_schema; Owner: sujalvijay
--

CREATE TABLE dsa_bot_schema.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE dsa_bot_schema.users OWNER TO sujalvijay;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: dsa_bot_schema; Owner: sujalvijay
--

CREATE SEQUENCE dsa_bot_schema.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dsa_bot_schema.users_id_seq OWNER TO sujalvijay;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: dsa_bot_schema; Owner: sujalvijay
--

ALTER SEQUENCE dsa_bot_schema.users_id_seq OWNED BY dsa_bot_schema.users.id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: dsauser
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO dsauser;

--
-- Name: users id; Type: DEFAULT; Schema: dsa_bot_schema; Owner: sujalvijay
--

ALTER TABLE ONLY dsa_bot_schema.users ALTER COLUMN id SET DEFAULT nextval('dsa_bot_schema.users_id_seq'::regclass);


--
-- Data for Name: users; Type: TABLE DATA; Schema: dsa_bot_schema; Owner: sujalvijay
--

COPY dsa_bot_schema.users (id, username, email, hashed_password, metadata, created_at, updated_at) FROM stdin;
1	admin	vjdeveloper121@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$/B+jlLK2dm4NobR2DqG0dg$w7hmszi5Q/Vzd0TX7SMYyaqRRFDjPVxFfFrAEMIXV1s	\N	2025-11-16 19:08:28.897782	2025-11-16 19:08:28.897787
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: dsauser
--

COPY public.alembic_version (version_num) FROM stdin;
2534d5b2f181
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: dsa_bot_schema; Owner: sujalvijay
--

SELECT pg_catalog.setval('dsa_bot_schema.users_id_seq', 1, true);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: dsa_bot_schema; Owner: sujalvijay
--

ALTER TABLE ONLY dsa_bot_schema.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: dsa_bot_schema; Owner: sujalvijay
--

ALTER TABLE ONLY dsa_bot_schema.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: dsa_bot_schema; Owner: sujalvijay
--

ALTER TABLE ONLY dsa_bot_schema.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: dsauser
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: ix_users_email; Type: INDEX; Schema: dsa_bot_schema; Owner: sujalvijay
--

CREATE INDEX ix_users_email ON dsa_bot_schema.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: dsa_bot_schema; Owner: sujalvijay
--

CREATE INDEX ix_users_id ON dsa_bot_schema.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: dsa_bot_schema; Owner: sujalvijay
--

CREATE INDEX ix_users_username ON dsa_bot_schema.users USING btree (username);


--
-- Name: SCHEMA dsa_bot_schema; Type: ACL; Schema: -; Owner: sujalvijay
--

GRANT ALL ON SCHEMA dsa_bot_schema TO dsauser;


--
-- Name: TABLE users; Type: ACL; Schema: dsa_bot_schema; Owner: sujalvijay
--

GRANT ALL ON TABLE dsa_bot_schema.users TO dsauser;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: dsa_bot_schema; Owner: sujalvijay
--

GRANT ALL ON SEQUENCE dsa_bot_schema.users_id_seq TO dsauser;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: dsa_bot_schema; Owner: sujalvijay
--

ALTER DEFAULT PRIVILEGES FOR ROLE sujalvijay IN SCHEMA dsa_bot_schema GRANT ALL ON SEQUENCES  TO dsauser;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: dsa_bot_schema; Owner: sujalvijay
--

ALTER DEFAULT PRIVILEGES FOR ROLE sujalvijay IN SCHEMA dsa_bot_schema GRANT ALL ON TABLES  TO dsauser;


--
-- PostgreSQL database dump complete
--

\unrestrict aBETxX7vksH8e5zjLe9FhY2rEHEGABVNSja1myl3FMg22RpbT3XIwVj2QomOuj0

