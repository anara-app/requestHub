export function getSelectData<T>(
  key: keyof T,
  value: keyof T,
  data: T[] = []
): { label: string; value: string }[] {
  return data.map((i) => ({
    label: i[key]!.toString(),
    value: i[value]!.toString(),
  }));
}
