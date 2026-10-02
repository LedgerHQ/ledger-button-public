export function lcovReporter(
  workspaceRoot: string,
): ["lcov", { projectRoot: string }] {
  return ["lcov", { projectRoot: workspaceRoot }];
}
