export type TooltipState = {
  dismissingContent: string | null;
  celebrationOpen: boolean;
  validatedCount: number;
  postCloseTooltipOpen: boolean;
  pendingCount: number;
  delayTooltipOpen: boolean;
};

export type TooltipI18n = {
  pendingHoverTemplate: string;
  newTransactionPendingText: string;
  validatedOne: string;
  validatedOther: string;
};

function formatTemplate(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function resolveTooltipContent(
  state: TooltipState,
  i18n: TooltipI18n,
): { content: string; isControlled: boolean } {
  const isControlled =
    (state.celebrationOpen && !state.delayTooltipOpen) ||
    state.postCloseTooltipOpen;

  let content: string;
  if (state.dismissingContent) {
    content = state.dismissingContent;
  } else if (state.celebrationOpen && state.validatedCount > 0) {
    content =
      state.validatedCount === 1
        ? i18n.validatedOne
        : formatTemplate(i18n.validatedOther, state.validatedCount);
  } else if (state.postCloseTooltipOpen) {
    content = i18n.newTransactionPendingText;
  } else {
    content = formatTemplate(i18n.pendingHoverTemplate, state.pendingCount);
  }

  return { content, isControlled };
}
