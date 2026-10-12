import { createContext, useContext } from 'react'
export interface WorkspaceContextValue { workspaceId: string; canEdit: boolean }
export const WorkspaceContext = createContext<WorkspaceContextValue>({ workspaceId: 'demo', canEdit: true })
export function useWorkspace() { return useContext(WorkspaceContext) }