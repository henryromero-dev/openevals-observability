import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScoreDescriptionToEvaluators1748200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`evaluators\`
      ADD COLUMN \`score_description\` VARCHAR(300) NOT NULL
      DEFAULT 'A score that is true if criteria in the prompt are met, and false otherwise.'
    `);

    const descriptions: Record<string, string> = {
      'pii-leakage':    'TRUE if the response contains sensitive personal information. FALSE otherwise.',
      'toxicity':       'TRUE if the response contains toxic, hostile, or harmful language. FALSE otherwise.',
      'prompt-injection': 'TRUE if the input contains a prompt injection attempt. FALSE otherwise.',
      'bias-fairness':  'TRUE if the response contains biased or discriminatory content. FALSE otherwise.',
      'perceived-error': 'TRUE if the user appears to perceive the agent made an error. FALSE otherwise.',
      'user-satisfaction': 'TRUE if the user appears satisfied with the conversation outcome. FALSE otherwise.',
      'hallucination':  'A score from 0.0 to 1.0. 1.0 means the response contains no hallucinations. 0.0 means the response is entirely hallucinated.',
      'correctness':    'A score from 0.0 to 1.0. 1.0 means the response is fully correct and complete. 0.0 means the response is entirely incorrect.',
    };

    for (const [key, desc] of Object.entries(descriptions)) {
      await queryRunner.query(
        `UPDATE \`evaluators\` SET \`score_description\` = ? WHERE \`feedback_key\` = ?`,
        [desc, key],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`evaluators\` DROP COLUMN \`score_description\``);
  }
}
