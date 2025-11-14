import { crdtService } from "@/core/sync/crdt";
import { kyselyQueryService } from "@/core/sync/query";
import { CRDTRule } from "@nuts/types";
import { CreateTransactionRule, UpdateTransactionRule, TransactionRule } from "./rule.types";
import { Result, ok, err, ServiceError } from "@/lib/result";
import { uuidV7 } from "@nuts/utils";
import { anonymousUserService } from "@/features/auth/services/anonymous-user.service";

export function createRulesService() {
  let isInitialized = false;

  const ensureInitialized = async (): Promise<Result<void, ServiceError>> => {
    if (!isInitialized) {
      return await initialize();
    }
    return ok(undefined);
  };

  const initialize = async (): Promise<Result<void, ServiceError>> => {
    if (isInitialized) return ok(undefined);

    const crdtResult = await crdtService.initialize();
    if (crdtResult.isErr()) return err(crdtResult.error);

    const kyselyResult = await kyselyQueryService.initialize();
    if (kyselyResult.isErr()) return err(kyselyResult.error);

    const transactions = crdtService.getTransactions();
    const accounts = crdtService.getAccounts();
    const categories = crdtService.getCategories();
    const rules = crdtService.getRules();

    const rebuildResult = await kyselyQueryService.rebuildFromCRDT(transactions, accounts, categories, rules);
    if (rebuildResult.isErr()) return err(rebuildResult.error);

    isInitialized = true;
    console.log("[RULES] Service initialized");
    return ok(undefined);
  };

  const getRules = async (): Promise<Result<TransactionRule[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const rulesResult = await kyselyQueryService.getRules();
    if (rulesResult.isErr()) return err(rulesResult.error);

    return ok(rulesResult.value as TransactionRule[]);
  };

  const getRule = async (id: string): Promise<Result<TransactionRule | null, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const rule = crdtService.getRule(id);
      if (!rule) return ok(null);

      return ok({
        ...rule,
        created_at: new Date(rule.created_at),
        updated_at: new Date(rule.updated_at),
        deleted_at: rule.deleted_at ? new Date(rule.deleted_at) : undefined,
      } as TransactionRule);
    } catch (error) {
      console.error("[RULES] Error getting rule:", error);
      return err(ServiceError.operation("get", "rule", error));
    }
  };

  const createRule = async (data: CreateTransactionRule): Promise<Result<TransactionRule, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const userId = anonymousUserService.getUserId();
      const ruleId = uuidV7();

      const crdtRule: Omit<CRDTRule, "created_at" | "updated_at"> = {
        id: ruleId,
        name: data.name,
        is_active: data.is_active ?? true,
        priority: data.priority ?? 0,
        conditions: data.conditions,
        actions: data.actions,
        created_by: userId,
        updated_by: undefined,
        deleted_at: undefined,
      };

      console.log("[RULES] Creating rule:", crdtRule.name);
      const createResult = await crdtService.createRule(crdtRule);
      if (createResult.isErr()) return err(createResult.error);

      console.log("[RULES] Rule created in CRDT, rebuilding SQLite...");
      await rebuildFromCRDT();

      const createdRule = crdtService.getRule(ruleId);
      if (!createdRule) {
        return err(ServiceError.operation("retrieve", "created rule"));
      }

      console.log("[RULES] ✅ Rule created successfully:", ruleId);
      return ok({
        ...createdRule,
        created_at: new Date(createdRule.created_at),
        updated_at: new Date(createdRule.updated_at),
        deleted_at: createdRule.deleted_at ? new Date(createdRule.deleted_at) : undefined,
      } as TransactionRule);
    } catch (error) {
      console.error("[RULES] Error creating rule:", error);
      return err(ServiceError.operation("create", "rule", error));
    }
  };

  const updateRule = async (id: string, data: UpdateTransactionRule): Promise<Result<TransactionRule, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const existingRule = crdtService.getRule(id);
      if (!existingRule) {
        return err(ServiceError.notFound("Rule", id));
      }

      const userId = anonymousUserService.getUserId();

      const updates: Partial<CRDTRule> = {
        ...data,
        updated_by: userId,
      };

      console.log("[RULES] Updating rule:", id);
      const updateResult = await crdtService.updateRule(id, updates);
      if (updateResult.isErr()) return err(updateResult.error);

      console.log("[RULES] Rule updated in CRDT, rebuilding SQLite...");
      await rebuildFromCRDT();

      const updatedRule = crdtService.getRule(id);
      if (!updatedRule) {
        return err(ServiceError.operation("retrieve", "updated rule"));
      }

      console.log("[RULES] ✅ Rule updated successfully:", id);
      return ok({
        ...updatedRule,
        created_at: new Date(updatedRule.created_at),
        updated_at: new Date(updatedRule.updated_at),
        deleted_at: updatedRule.deleted_at ? new Date(updatedRule.deleted_at) : undefined,
      } as TransactionRule);
    } catch (error) {
      console.error("[RULES] Error updating rule:", error);
      return err(ServiceError.operation("update", "rule", error));
    }
  };

  const deleteRule = async (id: string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const existingRule = crdtService.getRule(id);
      if (!existingRule) {
        return err(ServiceError.notFound("Rule", id));
      }

      console.log("[RULES] Deleting rule:", id);
      const deleteResult = await crdtService.deleteRule(id);
      if (deleteResult.isErr()) return err(deleteResult.error);

      console.log("[RULES] Rule deleted in CRDT, rebuilding SQLite...");
      await rebuildFromCRDT();

      console.log("[RULES] ✅ Rule deleted successfully:", id);
      return ok(undefined);
    } catch (error) {
      console.error("[RULES] Error deleting rule:", error);
      return err(ServiceError.operation("delete", "rule", error));
    }
  };

  const rebuildFromCRDT = async () => {
    console.log("[RULES] rebuildFromCRDT: Fetching data from CRDT...");
    const transactions = crdtService.getTransactions();
    const accounts = crdtService.getAccounts();
    const categories = crdtService.getCategories();
    const rules = crdtService.getRules();

    console.log("[RULES] rebuildFromCRDT: Found", Object.keys(rules).length, "rules");
    console.log("[RULES] rebuildFromCRDT: Calling kyselyQueryService.rebuildFromCRDT...");

    const rebuildResult = await kyselyQueryService.rebuildFromCRDT(transactions, accounts, categories, rules);
    if (rebuildResult.isErr()) throw rebuildResult.error;

    console.log("[RULES] rebuildFromCRDT: ✅ SQLite rebuild complete");
  };

  return {
    initialize,
    getRules,
    getRule,
    createRule,
    updateRule,
    deleteRule,
  };
}

export const rulesService = createRulesService();
