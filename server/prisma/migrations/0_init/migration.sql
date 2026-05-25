-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('Prime', 'Marino', 'Liberty');
CREATE TYPE "Role" AS ENUM ('MANAGER', 'ADMIN');
CREATE TYPE "TaxMode" AS ENUM ('VAT18', 'NO_TAX', 'VAT18_SSCL25', 'FLAT205', 'VAT_INCLUSIVE');
CREATE TYPE "Status" AS ENUM ('DRAFT', 'SENT', 'VIEWED');

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "branch" "Branch" NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Quotation
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "globalNum" INTEGER NOT NULL UNIQUE,
    "branch" "Branch" NOT NULL,
    "managerId" TEXT NOT NULL REFERENCES "User"("id"),
    "clientName" TEXT NOT NULL,
    "clientAddr" TEXT,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "taxMode" "TaxMode" NOT NULL,
    "items" JSONB NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "ssclAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "downloadToken" TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Counter
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "value" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "Counter" ("id", "value") VALUES ('global', 0) ON CONFLICT DO NOTHING;
