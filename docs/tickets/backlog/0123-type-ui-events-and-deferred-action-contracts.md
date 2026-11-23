# Ticket 0123: Type UI Events And Deferred Action Contracts

## Status
- State: Deferred
- Priority: Low
- Next: Inventory active Trigger payloads and their component versus store subscription lifetimes.

## Goal
Make UI events expose clear, compiler-checked payload contracts and usable subscription cleanup. Ensure deferred confirmation actions retain the request values they were created to confirm.

## Requirements
- [ ] Each active Trigger declares its payload shape, including whether a payload is optional or absent, and publish/subscribe enforce that contract.
- [ ] Event callbacks no longer rely on Function and arbitrary any payloads in the shared bus.
- [ ] subscribe returns a usable disposer or subscription handle; component teardown can remove the exact listener without reconstructing an internal Event object.
- [ ] Component-scoped listeners are disposed appropriately while intentional store/app-lifetime subscriptions remain available for their full lifetime.
- [ ] Deferred popup actions capture required request values before transient form state is cleared or changed.
- [ ] The login forgot-password confirmation sends the username that opened the popup, even after the login form closes.
- [ ] Tests cover payload typing, unsubscribe/remount behavior, optional login prefill, authenticated-user events, and the deferred password-reset request value.

## Tasks
- [ ] Define a typed Trigger-to-payload contract using the current event bus rather than replacing it with another messaging system.
- [ ] Return and wire explicit subscription cleanup for component listeners.
- [ ] Type popup callback payloads and migrate active event publishers/subscribers.
- [ ] Capture the login reset identifier before closeLogin clears the form and audit analogous deferred actions.
- [ ] Add focused event-contract and browser regressions.

## Notes
- The current bus accepts Function callbacks and any payloads. unsubscribe requires the exact internal Event object, but subscribe does not return it.
- This establishes a missing lifecycle API; the static review did not prove an existing navigation-related listener leak.
- Login.forgetPassword publishes an accept callback that later reads username.value, then immediately calls closeLogin, which clears that value.
- Typing event payloads alone will not repair deferred closure state; preserve an explicit snapshot in the affected action.
- Retain the current event ordering, login prefill behavior, and intentional application/store subscription lifetimes.

## Relevant Files
- app/utils/events.ts
- app/app.vue
- app/components/system/Login.client.vue
- app/components/system/UserManager.client.vue
- app/components/system/Reporter.client.vue
- app/utils/session.ts
- app/utils/cache.ts
- app/utils/hints.ts
- tests/parallel/account.browser.test.ts
- tests/parallel/

## Progress Log
- 2026-11-17: Ticket created from the developer consistency review. Event lifetimes and password-reset behavior were inspected statically only.
