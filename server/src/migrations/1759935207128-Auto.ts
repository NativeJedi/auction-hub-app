import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1759935207128 implements MigrationInterface {
    name = 'Auto1759935207128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "buyer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying(255) NOT NULL, CONSTRAINT "PK_0480fc3c7289846a31b8e1bc503" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."lot_status_enum" AS ENUM('created', 'sold', 'unsold')`);
        await queryRunner.query(`CREATE TYPE "public"."lot_currency_enum" AS ENUM('USD', 'EUR', 'UAH')`);
        await queryRunner.query(`CREATE TABLE "lot" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "startPrice" integer NOT NULL, "description" character varying, "images" text, "status" "public"."lot_status_enum" NOT NULL DEFAULT 'created', "currency" "public"."lot_currency_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "soldPrice" integer, "auctionId" uuid NOT NULL, "buyerId" uuid, CONSTRAINT "REL_2abf15fd62289693d81d715b5c" UNIQUE ("buyerId"), CONSTRAINT "PK_2ba293e2165c7b93cd766c8ac9b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."auction_status_enum" AS ENUM('created', 'started', 'finished')`);
        await queryRunner.query(`CREATE TABLE "auction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "status" "public"."auction_status_enum" NOT NULL DEFAULT 'created', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid NOT NULL, CONSTRAINT "PK_9dc876c629273e71646cf6dfa67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lot" ADD CONSTRAINT "FK_98fe15332f5d4e0da4ab4f1b956" FOREIGN KEY ("auctionId") REFERENCES "auction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lot" ADD CONSTRAINT "FK_2abf15fd62289693d81d715b5c3" FOREIGN KEY ("buyerId") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auction" ADD CONSTRAINT "FK_612921ecd63175bd714dc1b1291" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auction" DROP CONSTRAINT "FK_612921ecd63175bd714dc1b1291"`);
        await queryRunner.query(`ALTER TABLE "lot" DROP CONSTRAINT "FK_2abf15fd62289693d81d715b5c3"`);
        await queryRunner.query(`ALTER TABLE "lot" DROP CONSTRAINT "FK_98fe15332f5d4e0da4ab4f1b956"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "auction"`);
        await queryRunner.query(`DROP TYPE "public"."auction_status_enum"`);
        await queryRunner.query(`DROP TABLE "lot"`);
        await queryRunner.query(`DROP TYPE "public"."lot_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."lot_status_enum"`);
        await queryRunner.query(`DROP TABLE "buyer"`);
    }

}
