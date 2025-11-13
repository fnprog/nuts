import type { Level } from "./types";

type LevelNum = 4 | 3 | 2 | 1 | 0;

interface Rules {
  named?: Record<string, LevelNum>;
  defaultLevel?: LevelNum;
}

const LEVEL_TO_NUM: Record<Level | "off" | "*" | "", LevelNum> = {
  "*": 4,
  debug: 4,
  info: 3,
  warn: 2,
  error: 1,
  off: 0,
  "": 0,
};

function parseRules(): Rules {
  const nutsLog: string = (() => {
    try {
      return (typeof window !== "undefined" ? window.localStorage.nutsLog : "") || "";
    } catch {
      return "";
    }
  })();

  const PRODUCTION_DEFAULT = {};
  const DEV_DEFAULT = {
    defaultLevel: LEVEL_TO_NUM["*"],
  };
  const isDevelopment = import.meta.env.DEV;
  const defaultRules = isDevelopment ? DEV_DEFAULT : PRODUCTION_DEFAULT;

  const rules: Rules = nutsLog.length > 0 ? {} : defaultRules;

  for (const directive of nutsLog.split(",").filter((v) => v)) {
    const parts = directive.split("=");
    if (parts.length !== 2) {
      continue;
    }

    const [name, maxLevelName] = parts;
    const maxLevel = LEVEL_TO_NUM[maxLevelName as keyof typeof LEVEL_TO_NUM];

    if (typeof maxLevel === "undefined") {
      continue;
    }

    if (name === "*") {
      rules.defaultLevel = maxLevel;
    } else {
      rules.named = rules.named ?? {};
      rules.named[name] = maxLevel;
    }
  }

  return rules;
}

export function shouldLog(name: string, level: Level): boolean {
  const rules = parseRules();

  const maxLevel = (rules.named || {})[name] ?? rules.defaultLevel ?? 0;
  return LEVEL_TO_NUM[level] <= maxLevel;
}
