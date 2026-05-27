import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerifiedToUser1779840000000 implements MigrationInterface {
  name = 'AddEmailVerifiedToUser1779840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "emailVerified" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "emailVerified"`);
  }
}
