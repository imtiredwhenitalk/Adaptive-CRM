export const dataTableNames = ['contacts', 'deals', 'tasks', 'signals'] as const
export type DataTable = typeof dataTableNames[number]
