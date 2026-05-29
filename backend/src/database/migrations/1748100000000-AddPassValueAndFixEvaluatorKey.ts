import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPassValueAndFixEvaluatorKey1748100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add pass_value column — default true (score=true means pass)
    await queryRunner.query(`
      ALTER TABLE \`evaluators\`
      ADD COLUMN \`pass_value\` TINYINT(1) NOT NULL DEFAULT 1
    `);

    // PII Leakage and Toxicity: score=false means "no problem found" = PASS
    // So their passValue is false
    await queryRunner.query(`
      UPDATE \`evaluators\`
      SET \`pass_value\` = 0
      WHERE \`feedback_key\` IN ('pllleakage', 'toxicity')
    `);

    // Fix the typo in feedback_key
    await queryRunner.query(`
      UPDATE \`evaluators\`
      SET \`feedback_key\` = 'pii-leakage'
      WHERE \`feedback_key\` = 'pllleakage'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`evaluators\`
      SET \`feedback_key\` = 'pllleakage'
      WHERE \`feedback_key\` = 'pii-leakage'
    `);
    await queryRunner.query(`
      ALTER TABLE \`evaluators\` DROP COLUMN \`pass_value\`
    `);
  }
}
