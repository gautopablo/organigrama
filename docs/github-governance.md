# Configuración recomendada en GitHub

Configurar en el repo:

1. Branch protection para `main`:
   - Require pull request before merging
   - Require approvals: 1
   - Require status checks to pass (`CI / test-and-build`)
   - Dismiss stale approvals when new commits are pushed
2. Restrict direct pushes a `main`.
3. Habilitar squash merge.
4. Habilitar auto-delete branch on merge.
