import { inject, injectable } from "inversify";

import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import type { CounterValueDataSource } from "../../balance/datasource/countervalue/CounterValueDataSource.js";
import type { Account, FiatBalance } from "../service/AccountService.js";

@injectable()
export class HydrateAccountWithFiatUseCase {
  constructor(
    @inject(balanceModuleTypes.CounterValueDataSource)
    private readonly counterValueDataSource: CounterValueDataSource,
  ) {}

  async execute(
    account: Account,
    targetCurrency = "usd",
  ): Promise<Account & { fiatBalance: FiatBalance | undefined }> {
    if (!account.balance) {
      return { ...account, fiatBalance: undefined };
    }

    const result = await this.counterValueDataSource.getCounterValues(
      [account.currencyId],
      targetCurrency,
    );

    if (result.isLeft()) {
      return { ...account, fiatBalance: undefined };
    }

    const counterValues = result.unsafeCoerce();
    const rate = counterValues[0]?.rate ?? 0;
    const balance = parseFloat(account.balance);

    if (Number.isNaN(balance)) {
      return { ...account, fiatBalance: undefined };
    }

    const fiatValue = balance * rate;

    return {
      ...account,
      fiatBalance: {
        value: fiatValue.toFixed(2),
        currency: targetCurrency.toUpperCase(),
      },
    };
  }
}
