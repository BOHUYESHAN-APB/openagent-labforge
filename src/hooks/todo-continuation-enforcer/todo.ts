import type { Todo } from "./types"
import type { RuntimeWorkflowTodoNode } from "../../features/boulder-state"

export function getIncompleteCount(todos: Todo[]): number {
  return todos.filter(
    (todo) =>
      todo.status !== "completed"
      && todo.status !== "cancelled"
      && todo.status !== "blocked"
      && todo.status !== "deleted",
  ).length
}

export function getTodoSnapshot(todos: Todo[]): string {
  const normalizedTodos = todos
    .map((todo) => ({
      id: todo.id ?? null,
      content: todo.content,
      priority: todo.priority,
      status: todo.status,
    }))
    .sort((left, right) => {
      const leftKey = left.id ?? `${left.content}:${left.priority}:${left.status}`
      const rightKey = right.id ?? `${right.content}:${right.priority}:${right.status}`
      if (leftKey !== rightKey) {
        return leftKey.localeCompare(rightKey)
      }
      if (left.content !== right.content) {
        return left.content.localeCompare(right.content)
      }
      if (left.priority !== right.priority) {
        return left.priority.localeCompare(right.priority)
      }
      return left.status.localeCompare(right.status)
    })

  return JSON.stringify(normalizedTodos)
}

export function getActiveStructuredTodos(
  todos: RuntimeWorkflowTodoNode[] | undefined,
): RuntimeWorkflowTodoNode[] {
  if (!todos) return []

  return todos.filter(
    (todo) =>
      todo.status !== "completed" &&
      todo.status !== "cancelled" &&
      todo.status !== "deleted",
  )
}

export function getAgentOwnedStructuredTodoCount(
  todos: RuntimeWorkflowTodoNode[] | undefined,
): number {
  return getActiveStructuredTodos(todos).filter((todo) => todo.owner === "agent")
    .length
}
