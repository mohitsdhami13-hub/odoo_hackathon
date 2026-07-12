--
-- PostgreSQL database dump
--

\restrict Q3cUL2VyV9sgmEvtgt4IkPCvlSwQVTMkYqcz6sz8AFcDk7YMHxvdLa7zAdrlwGe

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AllocationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AllocationStatus" AS ENUM (
    'ACTIVE',
    'RETURNED'
);


ALTER TYPE public."AllocationStatus" OWNER TO postgres;

--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'AVAILABLE',
    'ALLOCATED',
    'RESERVED',
    'UNDER_MAINTENANCE',
    'RETIRED'
);


ALTER TYPE public."AssetStatus" OWNER TO postgres;

--
-- Name: AuditItemStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditItemStatus" AS ENUM (
    'UNVERIFIED',
    'VERIFIED',
    'MISSING',
    'DAMAGED'
);


ALTER TYPE public."AuditItemStatus" OWNER TO postgres;

--
-- Name: AuditStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditStatus" AS ENUM (
    'OPEN',
    'CLOSED'
);


ALTER TYPE public."AuditStatus" OWNER TO postgres;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'UPCOMING',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."BookingStatus" OWNER TO postgres;

--
-- Name: MaintenancePriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MaintenancePriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."MaintenancePriority" OWNER TO postgres;

--
-- Name: MaintenanceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MaintenanceStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'IN_PROGRESS',
    'RESOLVED'
);


ALTER TYPE public."MaintenanceStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'EMPLOYEE',
    'DEPARTMENT_HEAD',
    'ASSET_MANAGER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: TransferStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransferStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."TransferStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ActivityLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ActivityLog" (
    id text NOT NULL,
    action text NOT NULL,
    "assetId" text,
    "userId" text,
    details text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ActivityLog" OWNER TO postgres;

--
-- Name: Allocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Allocation" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "employeeId" text,
    "departmentId" text,
    status public."AllocationStatus" DEFAULT 'ACTIVE'::public."AllocationStatus" NOT NULL,
    "allocatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expectedReturnDate" timestamp(3) without time zone,
    "returnedAt" timestamp(3) without time zone,
    "conditionOnReturn" text
);


ALTER TABLE public."Allocation" OWNER TO postgres;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "assetTag" text NOT NULL,
    name text NOT NULL,
    "categoryId" text NOT NULL,
    "serialNumber" text,
    "acquisitionDate" timestamp(3) without time zone,
    "acquisitionCost" double precision,
    condition text,
    location text,
    "isBookable" boolean DEFAULT false NOT NULL,
    status public."AssetStatus" DEFAULT 'AVAILABLE'::public."AssetStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Asset" OWNER TO postgres;

--
-- Name: AssetCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AssetCategory" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AssetCategory" OWNER TO postgres;

--
-- Name: AuditCycle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditCycle" (
    id text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    status public."AuditStatus" DEFAULT 'OPEN'::public."AuditStatus" NOT NULL,
    "departmentId" text,
    "createdBy" text NOT NULL
);


ALTER TABLE public."AuditCycle" OWNER TO postgres;

--
-- Name: AuditItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditItem" (
    id text NOT NULL,
    "auditId" text NOT NULL,
    "assetId" text NOT NULL,
    status public."AuditItemStatus" DEFAULT 'UNVERIFIED'::public."AuditItemStatus" NOT NULL,
    notes text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AuditItem" OWNER TO postgres;

--
-- Name: Booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "bookedById" text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    status public."BookingStatus" DEFAULT 'UPCOMING'::public."BookingStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Booking" OWNER TO postgres;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    name text NOT NULL,
    "headId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Department" OWNER TO postgres;

--
-- Name: MaintenanceRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MaintenanceRequest" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "raisedById" text NOT NULL,
    issue text NOT NULL,
    priority public."MaintenancePriority" DEFAULT 'MEDIUM'::public."MaintenancePriority" NOT NULL,
    status public."MaintenanceStatus" DEFAULT 'PENDING'::public."MaintenanceStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


ALTER TABLE public."MaintenanceRequest" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: TransferRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TransferRequest" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "requestedById" text NOT NULL,
    "toEmployeeId" text,
    status public."TransferStatus" DEFAULT 'PENDING'::public."TransferStatus" NOT NULL,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


ALTER TABLE public."TransferRequest" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'EMPLOYEE'::public."Role" NOT NULL,
    "departmentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: ActivityLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ActivityLog" (id, action, "assetId", "userId", details, "createdAt") FROM stdin;
cmrhlmrju0009r8hu315gdth2	ASSET_REGISTERED	cmrhlmrjf0008r8hubu8zfivy	cmrh9kptb0002hchu9l8le21b	Registered new asset: airplane	2026-07-12 09:36:32.25
cmrhlqbyx000br8hufclkb8m7	ALLOCATED	cmrhl4rxx0000r8hujhssd3sp	cmrh9kptb0002hchu9l8le21b	Allocated to Priya Sharma	2026-07-12 09:39:18.681
cmrhm2ais000dr8huvmbn45o9	BOOKED	cmrh9kpu8000dhchulme2w3ut	cmrh9kptb0002hchu9l8le21b	Booked for 12/7/2026	2026-07-12 09:48:36.676
\.


--
-- Data for Name: Allocation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Allocation" (id, "assetId", "employeeId", "departmentId", status, "allocatedAt", "expectedReturnDate", "returnedAt", "conditionOnReturn") FROM stdin;
cmrh9kpub000ghchu9cnxjjce	cmrh9kpu4000ahchusjjqofe7	cmrh9kptn0005hchuo9ds7ck0	\N	ACTIVE	2024-06-01 00:00:00	2026-07-09 03:59:01.331	\N	\N
cmrh9kpud000hhchutx42fqwt	cmrh9kpu7000chchuh91kpo7n	cmrh9kpto0006hchu5mjnyv7p	\N	ACTIVE	2024-09-15 00:00:00	2026-07-22 03:59:01.331	\N	\N
cmrhlqby5000ar8huia19xvxc	cmrhl4rxx0000r8hujhssd3sp	cmrh9kptn0005hchuo9ds7ck0	\N	ACTIVE	2026-07-12 09:39:18.653	2026-07-12 00:00:00	\N	\N
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Asset" (id, "assetTag", name, "categoryId", "serialNumber", "acquisitionDate", "acquisitionCost", condition, location, "isBookable", status, "createdAt") FROM stdin;
cmrh9kpu4000ahchusjjqofe7	AF-0001	Dell Latitude 5440	cmrh9kptt0007hchu5hc01thb	SN-LAP-0001	2024-03-10 00:00:00	82000	Good	Engineering Floor 2	f	ALLOCATED	2026-07-12 03:59:01.324
cmrh9kpu6000bhchuo2mc4i0r	AF-0002	Dell Latitude 5440	cmrh9kptt0007hchu5hc01thb	SN-LAP-0002	2024-03-10 00:00:00	82000	Good	Store Room	f	AVAILABLE	2026-07-12 03:59:01.326
cmrh9kpu7000chchuh91kpo7n	AF-0003	Ergonomic Office Chair	cmrh9kptv0008hchuqpkvfilf	SN-CHR-0001	2023-11-05 00:00:00	12000	Good	Marketing Floor 1	f	ALLOCATED	2026-07-12 03:59:01.327
cmrh9kpu8000dhchulme2w3ut	AF-0004	Epson Projector EB-X06	cmrh9kptt0007hchu5hc01thb	SN-PRJ-0001	2023-08-20 00:00:00	35000	Good	Conference Room B2	t	AVAILABLE	2026-07-12 03:59:01.328
cmrh9kpu9000ehchug1yzz71t	AF-0005	Company Car — Toyota Innova	cmrh9kptx0009hchu34d69z9w	SN-VEH-0001	2022-01-15 00:00:00	1450000	Needs Repair	Parking Lot A	t	UNDER_MAINTENANCE	2026-07-12 03:59:01.329
cmrh9kpua000fhchuemnc19sn	AF-0006	Standing Desk (Old Model)	cmrh9kptv0008hchuqpkvfilf	SN-DSK-0001	2019-06-01 00:00:00	9000	Worn	Storage	f	RETIRED	2026-07-12 03:59:01.33
cmrhlmrjf0008r8hubu8zfivy	AF-0008	airplane	cmrh9kptx0009hchu34d69z9w	86574321	\N	\N	new	Mumbai	t	AVAILABLE	2026-07-12 09:36:32.235
cmrhl4rxx0000r8hujhssd3sp	AF-0007	Audi	cmrh9kptx0009hchu34d69z9w	1234234	\N	\N	new	delhi	f	ALLOCATED	2026-07-12 09:22:32.95
\.


--
-- Data for Name: AssetCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AssetCategory" (id, name, "createdAt") FROM stdin;
cmrh9kptt0007hchu5hc01thb	Electronics	2026-07-12 03:59:01.313
cmrh9kptv0008hchuqpkvfilf	Furniture	2026-07-12 03:59:01.315
cmrh9kptx0009hchu34d69z9w	Vehicles	2026-07-12 03:59:01.317
\.


--
-- Data for Name: AuditCycle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditCycle" (id, name, "startDate", "endDate", status, "departmentId", "createdBy") FROM stdin;
cmrhl6vhg0001r8hu2b2xb0t2	Example13	2026-07-12 09:24:10.852	2026-07-12 10:02:53.448	CLOSED	\N	cmrh9kptb0002hchu9l8le21b
\.


--
-- Data for Name: AuditItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditItem" (id, "auditId", "assetId", status, notes, "updatedAt") FROM stdin;
cmrhl6vhl0003r8hukpz71oft	cmrhl6vhg0001r8hu2b2xb0t2	cmrh9kpu6000bhchuo2mc4i0r	VERIFIED	\N	2026-07-12 10:02:39.217
cmrhl6vhl0002r8huwa1cmh20	cmrhl6vhg0001r8hu2b2xb0t2	cmrh9kpu4000ahchusjjqofe7	VERIFIED	\N	2026-07-12 10:02:40.892
cmrhl6vhl0004r8huzku1mff9	cmrhl6vhg0001r8hu2b2xb0t2	cmrh9kpu7000chchuh91kpo7n	VERIFIED	\N	2026-07-12 10:02:41.583
cmrhl6vhm0005r8huuvcgolh9	cmrhl6vhg0001r8hu2b2xb0t2	cmrh9kpu8000dhchulme2w3ut	VERIFIED	\N	2026-07-12 10:02:42.069
cmrhl6vhm0007r8huy332wm6x	cmrhl6vhg0001r8hu2b2xb0t2	cmrhl4rxx0000r8hujhssd3sp	VERIFIED	\N	2026-07-12 10:02:44.664
cmrhl6vhm0006r8hu33rrzjr0	cmrhl6vhg0001r8hu2b2xb0t2	cmrh9kpu9000ehchug1yzz71t	VERIFIED	\N	2026-07-12 10:02:45.375
\.


--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Booking" (id, "assetId", "bookedById", "startTime", "endTime", status, "createdAt") FROM stdin;
cmrh9kpuf000jhchutu7vs6kd	cmrh9kpu8000dhchulme2w3ut	cmrh9kptn0005hchuo9ds7ck0	2026-07-13 04:30:00	2026-07-13 05:30:00	UPCOMING	2026-07-12 03:59:01.335
cmrh9kpug000khchudui111zs	cmrh9kpu8000dhchulme2w3ut	cmrh9kpto0006hchu5mjnyv7p	2026-07-05 08:30:00	2026-07-05 09:30:00	COMPLETED	2026-07-12 03:59:01.336
cmrhm2aie000cr8hunlhrlheo	cmrh9kpu8000dhchulme2w3ut	cmrh9kptb0002hchu9l8le21b	2026-07-12 10:48:00	2026-07-12 12:48:00	UPCOMING	2026-07-12 09:48:36.662
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Department" (id, name, "headId", "isActive", "createdAt") FROM stdin;
cmrh9kpt70001hchuothr6m8i	Marketing	\N	t	2026-07-12 03:59:01.291
cmrh9kpt10000hchub4kl6wxs	Engineering	cmrh9kptk0004hchufdo9stne	t	2026-07-12 03:59:01.285
\.


--
-- Data for Name: MaintenanceRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MaintenanceRequest" (id, "assetId", "raisedById", issue, priority, status, "createdAt", "resolvedAt") FROM stdin;
cmrh9kpuh000lhchu20by4l5d	cmrh9kpu9000ehchug1yzz71t	cmrh9kpto0006hchu5mjnyv7p	Engine making unusual noise, needs inspection	HIGH	APPROVED	2026-07-12 03:59:01.337	\N
cmrh9kpuj000mhchupm44icqh	cmrh9kpu6000bhchuo2mc4i0r	cmrh9kptn0005hchuo9ds7ck0	Battery draining faster than expected	LOW	PENDING	2026-07-12 03:59:01.339	\N
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", message, "isRead", "createdAt") FROM stdin;
cmrh9kpuk000nhchuinrw8a9f	cmrh9kpth0003hchuhwt23x9u	New maintenance request raised for AF-0005 (High priority)	f	2026-07-12 03:59:01.34
cmrh9kpuk000ohchu12l2v7m1	cmrh9kptk0004hchufdo9stne	Transfer request pending your approval for AF-0001	f	2026-07-12 03:59:01.34
\.


--
-- Data for Name: TransferRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TransferRequest" (id, "assetId", "requestedById", "toEmployeeId", status, "requestedAt", "resolvedAt") FROM stdin;
cmrh9kpue000ihchuoe5de823	cmrh9kpu4000ahchusjjqofe7	cmrh9kpto0006hchu5mjnyv7p	cmrh9kpto0006hchu5mjnyv7p	PENDING	2026-07-12 03:59:01.334	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, password, role, "departmentId", "isActive", "createdAt") FROM stdin;
cmrh9kptb0002hchu9l8le21b	Admin User	admin@assetflow.com	$2b$10$enm5wxf1aJw5rvJmXbmsR.SMXa0BFzG9EW9Xl0NVze6MCtMh0prTa	ADMIN	\N	t	2026-07-12 03:59:01.295
cmrh9kpth0003hchuhwt23x9u	Asha Patel	manager@assetflow.com	$2b$10$enm5wxf1aJw5rvJmXbmsR.SMXa0BFzG9EW9Xl0NVze6MCtMh0prTa	ASSET_MANAGER	\N	t	2026-07-12 03:59:01.301
cmrh9kptk0004hchufdo9stne	Rohan Mehta	depthead@assetflow.com	$2b$10$enm5wxf1aJw5rvJmXbmsR.SMXa0BFzG9EW9Xl0NVze6MCtMh0prTa	DEPARTMENT_HEAD	cmrh9kpt10000hchub4kl6wxs	t	2026-07-12 03:59:01.304
cmrh9kptn0005hchuo9ds7ck0	Priya Sharma	priya@assetflow.com	$2b$10$enm5wxf1aJw5rvJmXbmsR.SMXa0BFzG9EW9Xl0NVze6MCtMh0prTa	EMPLOYEE	cmrh9kpt10000hchub4kl6wxs	t	2026-07-12 03:59:01.307
cmrh9kpto0006hchu5mjnyv7p	Raj Verma	raj@assetflow.com	$2b$10$enm5wxf1aJw5rvJmXbmsR.SMXa0BFzG9EW9Xl0NVze6MCtMh0prTa	EMPLOYEE	cmrh9kpt70001hchuothr6m8i	t	2026-07-12 03:59:01.308
cmrhabpf10000echur2y2qxnq	Test Guy	test@assetflow.com	$2b$10$wx5FzncxAEWCDxEOflaDHOzEyowXlYX/lJx/Ptf3riMpftmjTbYFe	EMPLOYEE	\N	t	2026-07-12 04:20:00.493
cmrhad5m40001echupa0t7n59	Sneaky Guy	sneaky@assetflow.com	$2b$10$GKNypvihAp1LhE5/SjZG/.TJa39Wf3lsMih74L6PDGG502lYHH2vi	EMPLOYEE	\N	t	2026-07-12 04:21:08.14
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6910cb81-fbb1-4450-b77c-81ec41c23c5b	59d96ff4aa91113df00cc470b726cd306de5862f77ef906f2dbd39c547867372	2026-07-12 09:21:03.573348+05:30	20260712035103_init_assetflow	\N	\N	2026-07-12 09:21:03.530251+05:30	1
e089c147-fcd1-4464-96ea-e330e26973ee	1c873bf317a2fd00c9978223349fb1ab64f0fecc4879f50af8ac76863214979a	2026-07-12 09:27:02.588303+05:30	20260712035702_add_unique_constraints	\N	\N	2026-07-12 09:27:02.539292+05:30	1
\.


--
-- Name: ActivityLog ActivityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY (id);


--
-- Name: Allocation Allocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allocation"
    ADD CONSTRAINT "Allocation_pkey" PRIMARY KEY (id);


--
-- Name: AssetCategory AssetCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AssetCategory"
    ADD CONSTRAINT "AssetCategory_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: AuditCycle AuditCycle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditCycle"
    ADD CONSTRAINT "AuditCycle_pkey" PRIMARY KEY (id);


--
-- Name: AuditItem AuditItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditItem"
    ADD CONSTRAINT "AuditItem_pkey" PRIMARY KEY (id);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceRequest MaintenanceRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: TransferRequest TransferRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransferRequest"
    ADD CONSTRAINT "TransferRequest_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AssetCategory_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AssetCategory_name_key" ON public."AssetCategory" USING btree (name);


--
-- Name: Asset_assetTag_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Asset_assetTag_key" ON public."Asset" USING btree ("assetTag");


--
-- Name: Department_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_name_key" ON public."Department" USING btree (name);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: ActivityLog ActivityLog_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ActivityLog ActivityLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Allocation Allocation_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allocation"
    ADD CONSTRAINT "Allocation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Allocation Allocation_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allocation"
    ADD CONSTRAINT "Allocation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Allocation Allocation_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allocation"
    ADD CONSTRAINT "Allocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Asset Asset_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."AssetCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditCycle AuditCycle_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditCycle"
    ADD CONSTRAINT "AuditCycle_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditCycle AuditCycle_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditCycle"
    ADD CONSTRAINT "AuditCycle_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditItem AuditItem_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditItem"
    ADD CONSTRAINT "AuditItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditItem AuditItem_auditId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditItem"
    ADD CONSTRAINT "AuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES public."AuditCycle"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Booking Booking_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_bookedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Department Department_headId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_headId_fkey" FOREIGN KEY ("headId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MaintenanceRequest MaintenanceRequest_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaintenanceRequest MaintenanceRequest_raisedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransferRequest TransferRequest_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransferRequest"
    ADD CONSTRAINT "TransferRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Q3cUL2VyV9sgmEvtgt4IkPCvlSwQVTMkYqcz6sz8AFcDk7YMHxvdLa7zAdrlwGe

