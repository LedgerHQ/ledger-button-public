#!/usr/bin/env node

import { parseArgs } from "node:util";

import chalk from "chalk";

import {
  type Environment,
  type EventRequest,
  type ScenarioContext,
  scenarios,
} from "./scenarios.js";

const BACKEND_URLS: Record<Environment, string> = {
  production: "https://ledgerb.api.ledger.com",
  staging: "https://ledgerb.aws.stg.ldg-tech.com",
};

const DEFAULT_DAPP_ID = "tracking-simulator";
const DEFAULT_CHAIN_ID = "1";
const EVENT_DELAY_MS = 300;

const SCENARIO_NAMES = scenarios.map((s) => s.name);

const { values: args } = parseArgs({
  options: {
    env: {
      type: "string",
      short: "e",
      default: "staging",
    },
    scenario: {
      type: "string",
      short: "s",
      default: "full-session",
    },
    "dapp-id": {
      type: "string",
      short: "d",
      default: DEFAULT_DAPP_ID,
    },
    "chain-id": {
      type: "string",
      default: DEFAULT_CHAIN_ID,
    },
    delay: {
      type: "string",
      default: String(EVENT_DELAY_MS),
    },
    "dry-run": {
      type: "boolean",
      default: false,
    },
    list: {
      type: "boolean",
      short: "l",
      default: false,
    },
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
  },
  strict: true,
});

if (args.help) {
  console.log(`
${chalk.bold("Tracking Simulator")} — fire tracking events for ledger-button

${chalk.bold("Usage:")}
  pnpm tracking:test [options]

${chalk.bold("Options:")}
  -e, --env <env>         Environment: staging (default) or production
  -s, --scenario <name>   Scenario to run (default: full-session)
  -d, --dapp-id <id>      dApp identifier (default: ${DEFAULT_DAPP_ID})
      --chain-id <id>     Chain ID (default: ${DEFAULT_CHAIN_ID})
      --delay <ms>        Delay between events in ms (default: ${EVENT_DELAY_MS})
      --dry-run           Print events without sending
  -l, --list              List available scenarios
  -h, --help              Show this help
`);
  process.exit(0);
}

const env = args.env as Environment;
if (!BACKEND_URLS[env]) {
  console.error(chalk.red(`Invalid environment: "${env}". Use "staging" or "production".`));
  process.exit(1);
}

const scenarioName = args.scenario!;
if (!args.list && !SCENARIO_NAMES.includes(scenarioName)) {
  console.error(chalk.red(`Unknown scenario: "${scenarioName}"`));
  console.error(`Run with ${chalk.cyan("--list")} to see available scenarios.`);
  process.exit(1);
}

const opts = {
  env,
  scenarioName,
  dAppId: args["dapp-id"]!,
  chainId: args["chain-id"]!,
  delay: parseInt(args.delay!, 10),
  dryRun: args["dry-run"]!,
  list: args.list!,
};

async function sendEvent(
  baseUrl: string,
  dAppId: string,
  event: EventRequest,
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `${baseUrl}/event`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Ledger-Domain": dAppId,
    },
    body: JSON.stringify(event),
  });

  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  if (opts.list) {
    console.log(chalk.bold("\nAvailable scenarios:\n"));
    for (const s of scenarios) {
      console.log(`  ${chalk.cyan(s.name.padEnd(20))} ${s.description}`);
    }
    console.log();
    return;
  }

  const scenario = scenarios.find((s) => s.name === opts.scenarioName)!;

  const ctx: ScenarioContext = {
    dAppId: opts.dAppId,
    sessionId: crypto.randomUUID(),
    chainId: opts.chainId,
  };

  const events = scenario.buildEvents(ctx);
  const baseUrl = BACKEND_URLS[opts.env];

  console.log();
  console.log(chalk.bold("Tracking Simulator"));
  console.log(chalk.dim("─".repeat(50)));
  console.log(`  Scenario:    ${chalk.cyan(scenario.name)}`);
  console.log(`  Environment: ${chalk.yellow(opts.env)}`);
  console.log(`  Backend:     ${chalk.dim(baseUrl)}`);
  console.log(`  dApp ID:     ${opts.dAppId}`);
  console.log(`  Session:     ${chalk.dim(ctx.sessionId)}`);
  console.log(`  Chain ID:    ${opts.chainId}`);
  console.log(`  Events:      ${events.length}`);
  if (opts.dryRun) {
    console.log(`  Mode:        ${chalk.magenta("DRY RUN")}`);
  }
  console.log(chalk.dim("─".repeat(50)));
  console.log();

  let success = 0;
  let failed = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const index = chalk.dim(`[${i + 1}/${events.length}]`);

    if (opts.dryRun) {
      console.log(`${index} ${chalk.cyan(event.type)}`);
      console.log(chalk.dim(JSON.stringify(event.data, null, 2)));
      console.log();
      continue;
    }

    process.stdout.write(`${index} ${chalk.cyan(event.type)} ... `);

    try {
      const result = await sendEvent(baseUrl, opts.dAppId, event);
      if (result.ok) {
        console.log(chalk.green("✓"));
        success++;
      } else {
        console.log(chalk.red(`✗ ${result.status}`));
        console.log(chalk.dim(`    ${result.body}`));
        failed++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`✗ ${message}`));
      failed++;
    }

    if (i < events.length - 1) {
      await sleep(opts.delay);
    }
  }

  if (!opts.dryRun) {
    console.log();
    console.log(chalk.dim("─".repeat(50)));
    console.log(
      `  Results: ${chalk.green(`${success} passed`)}` +
        (failed > 0 ? `, ${chalk.red(`${failed} failed`)}` : ""),
    );
    console.log();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main();
