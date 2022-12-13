My solutions for Advent of Code 2022 implemented entirely in the type system of TypeScript.

Because the type system can't call the filesystem, input is treated as a (very large) string literal type that the solution types operate on.

To see the solutions work, open this code in a type-aware editor like vscode or the [typescript playground](https://www.typescriptlang.org/play).

I am convinced that 11b is impossible. There is no way to avoid typescript's caps on recursion. I tried the obvious solutions like running state manipulation in chunks to avoid going arbitrarily deep, inlining arithmetic, and even burying the recursion in an interface to force typescript to evaluate it lazily.

I don't think there's anything more to do here. I'll try next year; maybe there will be more TypeScript features then.
