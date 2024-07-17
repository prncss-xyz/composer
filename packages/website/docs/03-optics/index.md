---
---

# Optics

You can think of a **lens** as a way to focus on a part of an object. It lets you read or modify its value by returning an updated copy.

```typescript
exemple
```

**Optics** is the broader category which lens belongs to. An **optional** is an optitcs who's focus is not garanteed to exist. A **traversable** can have more than one focus. Some optics lets you remove the focus, can convert between types or units of mesurement. Most importantly, they compose with each other.

```
exemple
```

## Laws

## Use cases

- structural coupling (shape)
- hidden dependancy

- state-gui
- API

## Roadmap

- traversables

## Out of scope

- polymorphic optics

## Prior art

- [calmm-js/partial.lenses](https://github.com/calmm-js/partial.lenses) presents a wide collection of optics from the JavaScript era.
- [optics-ts](https://akheron.github.io/optics-ts/) is a very well made TypeScript library. It is my main inspiration for this project. Beside differences in ergonomics, I wanted something that was way less demanding on the TypeScript compiler.
