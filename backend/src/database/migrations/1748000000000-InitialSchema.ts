import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748000000000 implements MigrationInterface {
  name = 'InitialSchema1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE personas (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(120)  NOT NULL,
        description   VARCHAR(500)  NOT NULL DEFAULT '',
        system_prompt TEXT          NOT NULL,
        created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE evaluators (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(120)  NOT NULL,
        description      VARCHAR(500)  NOT NULL DEFAULT '',
        prompt_template  TEXT          NOT NULL,
        feedback_key     VARCHAR(80)   NOT NULL,
        model            VARCHAR(80)   NOT NULL DEFAULT 'openai:gpt-4o-mini',
        created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE simulations (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        name               VARCHAR(200) NOT NULL,
        persona_id         INT          NOT NULL,
        evaluator_ids      JSON         NOT NULL,
        initial_message    TEXT         NOT NULL,
        max_turns          INT          NOT NULL DEFAULT 10,
        status             ENUM('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
        langsmith_run_id   VARCHAR(200) NULL,
        error_message      TEXT         NULL,
        created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_simulation_persona FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryRunner.query(`
      CREATE TABLE simulation_results (
        id                       INT AUTO_INCREMENT PRIMARY KEY,
        simulation_id            INT          NOT NULL,
        turn_count               INT          NOT NULL DEFAULT 0,
        trajectory               JSON         NOT NULL,
        scores                   JSON         NOT NULL,
        langsmith_experiment_url VARCHAR(500) NULL,
        created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_result_simulation FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS simulation_results');
    await queryRunner.query('DROP TABLE IF EXISTS simulations');
    await queryRunner.query('DROP TABLE IF EXISTS evaluators');
    await queryRunner.query('DROP TABLE IF EXISTS personas');
  }
}
