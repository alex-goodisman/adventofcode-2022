namespace day5 {
  // the marker for end of initial state and start of sequence is an empty line
  // therefore, we need to make sure there aren't extraneous empty lines in the input at the start or end
  // hence trim
  type trim<S extends string> = S extends `\n${infer T}`
    ? trim<T>
    : S extends `${infer T}\n`
    ? trim<T>
    : S;

  // read one line. return [line, remainder]
  type readLine<
    S extends string,
    C extends string = ""
  > = S extends `${infer H}${infer T}`
    ? H extends "\n"
      ? [C, T]
      : readLine<T, `${C}${H}`>
    : [C, ""];

  // read lines until an empty line. return [[lines], remainder]
  type readUntilEmptyLine<
    S extends string,
    K extends string[] = []
  > = readLine<S> extends [infer C extends string, infer R extends string]
    ? C extends ""
      ? [K, R]
      : readUntilEmptyLine<R, [...K, C]>
    : never;

  // for the instructions, just stplit on newline
  type splitLines<
    S extends string,
    R extends string[] = []
  > = readLine<S> extends [infer H extends string, infer T extends string]
    ? T extends ""
      ? [...R, H]
      : splitLines<T, [...R, H]>
    : never;

  // in each line we only care about the numbers. we need to parse to an amount, a from, and a to
  // these can be more than one character, so accumulate numeric characters into a string until we
  // see a non numeric character or end. in this context, yields [amount, from, to]
  type parseLine<
    S extends string,
    C extends string = "",
    N extends number[] = []
  > = S extends `${infer H}${infer T}`
    ? [
        H extends `${infer _ extends number}` ? true : false,
        H extends " " ? true : false
      ] extends [true, false] //special case ' ' which parses as a number for some reason
      ? parseLine<T, `${C}${H}`, N> // saw a numeric character so add to C
      : C extends `${infer M extends number}` // saw a non numeric character
      ? parseLine<T, "", [...N, M]> // we had saved numbers, so add to N
      : parseLine<T, "", N> //we didnt have any saved numbers, so skip this character and continue
    : C extends `${infer M extends number}` //end of string, handle same as a non number character
    ? [...N, M]
    : N;

  // parse all lines
  type mapParseLine<S extends string[], R extends number[][] = []> = S extends [
    infer H extends string,
    ...infer T extends string[]
  ]
    ? mapParseLine<T, [...R, parseLine<H>]>
    : R extends [number, number, number][] // at the end, extra assert to make TS happy
    ? R
    : never;

  // reverse an array. useful for building the initial state, which needs to go bottom-up
  type reverse<A extends any[], R extends any[] = []> = A extends [
    infer H,
    ...infer T extends any[]
  ]
    ? reverse<T, [H, ...R]>
    : R;

  // state will be ['', 'NZ', 'DCM', 'P']
  // first, we need to make an array of the appropriate length containing empty strings
  // input is the line with the numbers. parse 1 char at a time, and add an empty string for every nonspace char
  type emptyState<
    S extends string,
    A extends string[] = [""]
  > = S extends `${infer H}${infer T}`
    ? H extends " "
      ? emptyState<T, A>
      : emptyState<T, ["", ...A]>
    : A;

  // take a line of initial box stack and remove the extra characters and parse to an array.
  // array has an extra 0 element that is empty, and each element will be one character if there is a box there and empty string if not
  type parseStateline<
    S extends string,
    R extends string[] = [""],
    K extends null[] = [null, null]
  > = S extends `${infer H}${infer T}`
    ? K["length"] extends 3 // read every fourth character (but start at 3)
      ? parseStateline<T, [...R, H extends " " ? "" : H], []>
      : parseStateline<T, R, [null, ...K]>
    : R;

  // concat respective elements of two string arrays
  type concat<
    A extends string[],
    B extends string[],
    C extends string[] = []
  > = A extends [infer HA extends string, ...infer TA extends string[]]
    ? B extends [infer HB extends string, ...infer TB extends string[]]
      ? concat<TA, TB, [...C, `${HA}${HB}`]>
      : C
    : C;

  // take the (reversed) lines before the break and make an initial state
  type buildState<S extends string[], A extends string[] = []> = S extends [
    infer H extends string,
    ...infer T extends string[]
  ]
    ? A extends []
      ? buildState<T, emptyState<H>> // special first case, build the empty state
      : buildState<T, concat<parseStateline<H>, A>> //append to existing state
    : A;

  // read N characters from S. returns [first N chars, remainder]
  type split<
    S extends string,
    N extends number,
    C extends null[] = [],
    R extends string = ""
  > = C["length"] extends N
    ? [R, S]
    : S extends `${infer H}${infer T}`
    ? split<T, N, [null, ...C], `${R}${H}`>
    : [R, S];

  // reverse a string. when we pull N chars from the 'from' column, we need to put them in the 'to' column in reverse order.
  type reverseString<
    S extends string,
    R extends string = ""
  > = S extends `${infer H}${infer T}` ? reverseString<T, `${H}${R}`> : R;

  // process one instruction. I has the form [number, from, to]. A is the state.
  // We can pre-split by indexing into A (this is what S does). Then we just iterate through
  // A, replacing the "from" and "to" elements with their modifiers and keeping the rest the same.
  // If it matches "from", replace with the remainder (2nd part of S). If it matches "to", replace with
  // the first part of S, reversed, attached to what was already there. Any other numbers keep as-is.
  // C is counter to follow the index. This is because you can't Omit<> from an array, so have to iterate instead.
  type runInsn<
    A extends string[],
    I extends [number, number, number],
    S extends [string, string] = split<A[I[1]], I[0]>,
    C extends null[] = [],
    R extends string[] = []
  > = A extends [infer H extends string, ...infer T extends string[]]
    ? C["length"] extends I[1]
      ? runInsn<T, I, S, [null, ...C], [...R, S[1]]> //in the "from" column, so replace H with S[1] (remainder)
      : C["length"] extends I[2]
      ? runInsn<T, I, S, [null, ...C], [...R, `${reverseString<S[0]>}${H}`]> //in the "to" column, so append reverse<S[0]> (transferred chars) to H
      : runInsn<T, I, S, [null, ...C], [...R, H]> //any other number keep H intact
    : R;

  // run a list of insn
  type mapRunInsn<
    I extends [number, number, number][],
    A extends string[]
  > = I extends [
    infer H extends [number, number, number],
    ...infer T extends [number, number, number][]
  ]
    ? mapRunInsn<T, runInsn<A, H>>
    : A;

  type parseAndRun<A extends [string[], string]> = mapRunInsn<
    mapParseLine<splitLines<A[1]>>,
    buildState<reverse<A[0]>>
  >;

  // after finishing, read off the top box on every stack and concat to a string.
  type tops<A extends string[], R extends string = ""> = A extends [
    infer H extends string,
    ...infer T extends string[]
  ]
    ? H extends `${infer O}${string}`
      ? tops<T, `${R}${O}`>
      : tops<T, R>
    : R;

  type data<I extends string> = readUntilEmptyLine<trim<I>>;
  type day5part1<I extends string> = tops<parseAndRun<data<I>>>;

  // process 1 instruction but maintain the relative order. This is almost the same as runInsn except don't reverse the added chars:
  type runInsnWithOrder<
    A extends string[],
    I extends [number, number, number],
    S extends [string, string] = split<A[I[1]], I[0]>,
    C extends null[] = [],
    R extends string[] = []
  > = A extends [infer H extends string, ...infer T extends string[]]
    ? C["length"] extends I[1]
      ? runInsnWithOrder<T, I, S, [null, ...C], [...R, S[1]]>
      : C["length"] extends I[2]
      ? runInsnWithOrder<T, I, S, [null, ...C], [...R, `${S[0]}${H}`]> //here S[0] (transferred chars) are concatted to H (existing chars in the "to" column) as-is instead of reversed
      : runInsnWithOrder<T, I, S, [null, ...C], [...R, H]>
    : R;

  type mapRunInsnWithOrder<
    I extends [number, number, number][],
    A extends string[]
  > = I extends [
    infer H extends [number, number, number],
    ...infer T extends [number, number, number][]
  ]
    ? mapRunInsnWithOrder<T, runInsnWithOrder<A, H>>
    : A;

  type parseAndRunWithOrder<A extends [string[], string]> = mapRunInsnWithOrder<
    mapParseLine<splitLines<A[1]>>,
    buildState<reverse<A[0]>>
  >;

  type day5part2<I extends string> = tops<parseAndRunWithOrder<data<I>>>;

  type input = `
[B]                     [N]     [H]
[V]         [P] [T]     [V]     [P]
[W]     [C] [T] [S]     [H]     [N]
[T]     [J] [Z] [M] [N] [F]     [L]
[Q]     [W] [N] [J] [T] [Q] [R] [B]
[N] [B] [Q] [R] [V] [F] [D] [F] [M]
[H] [W] [S] [J] [P] [W] [L] [P] [S]
[D] [D] [T] [F] [G] [B] [B] [H] [Z]
 1   2   3   4   5   6   7   8   9 

move 2 from 8 to 1
move 4 from 9 to 8
move 2 from 1 to 6
move 7 from 4 to 2
move 10 from 2 to 7
move 2 from 1 to 6
move 1 from 9 to 4
move 1 from 4 to 1
move 8 from 6 to 4
move 7 from 1 to 8
move 6 from 8 to 1
move 1 from 4 to 1
move 8 from 7 to 3
move 2 from 5 to 2
move 5 from 3 to 2
move 5 from 2 to 1
move 1 from 6 to 5
move 2 from 2 to 6
move 5 from 8 to 7
move 12 from 7 to 4
move 3 from 5 to 4
move 2 from 6 to 4
move 9 from 1 to 7
move 4 from 3 to 7
move 4 from 3 to 4
move 3 from 1 to 7
move 1 from 9 to 1
move 1 from 1 to 4
move 2 from 5 to 2
move 1 from 3 to 7
move 15 from 7 to 2
move 4 from 7 to 9
move 6 from 9 to 2
move 2 from 8 to 3
move 3 from 2 to 8
move 1 from 7 to 6
move 8 from 2 to 5
move 2 from 8 to 4
move 2 from 3 to 8
move 9 from 5 to 9
move 7 from 4 to 2
move 1 from 8 to 6
move 6 from 9 to 2
move 3 from 9 to 7
move 2 from 8 to 4
move 7 from 2 to 6
move 7 from 4 to 1
move 3 from 1 to 8
move 2 from 1 to 8
move 4 from 8 to 2
move 2 from 1 to 5
move 19 from 2 to 7
move 8 from 4 to 7
move 18 from 7 to 1
move 11 from 7 to 4
move 15 from 1 to 7
move 9 from 4 to 3
move 2 from 3 to 1
move 9 from 4 to 5
move 1 from 8 to 1
move 8 from 6 to 5
move 3 from 2 to 5
move 1 from 6 to 7
move 4 from 4 to 3
move 8 from 5 to 1
move 13 from 1 to 6
move 12 from 7 to 1
move 12 from 6 to 3
move 1 from 7 to 6
move 1 from 7 to 5
move 1 from 1 to 9
move 1 from 3 to 1
move 3 from 1 to 9
move 12 from 3 to 8
move 1 from 9 to 3
move 1 from 6 to 8
move 5 from 5 to 1
move 1 from 6 to 2
move 10 from 8 to 9
move 13 from 9 to 2
move 10 from 3 to 4
move 1 from 8 to 9
move 2 from 8 to 7
move 1 from 3 to 1
move 1 from 5 to 6
move 13 from 2 to 5
move 1 from 9 to 2
move 7 from 1 to 4
move 2 from 2 to 5
move 2 from 7 to 8
move 1 from 6 to 8
move 10 from 5 to 8
move 3 from 7 to 2
move 4 from 1 to 4
move 12 from 4 to 2
move 10 from 5 to 3
move 6 from 2 to 1
move 2 from 4 to 8
move 3 from 4 to 8
move 6 from 1 to 7
move 1 from 7 to 5
move 12 from 8 to 2
move 3 from 4 to 9
move 1 from 4 to 3
move 2 from 9 to 6
move 2 from 6 to 8
move 1 from 1 to 3
move 8 from 2 to 6
move 4 from 1 to 8
move 12 from 2 to 3
move 4 from 6 to 8
move 10 from 8 to 3
move 14 from 3 to 8
move 5 from 5 to 8
move 1 from 7 to 8
move 5 from 3 to 5
move 4 from 7 to 2
move 2 from 6 to 1
move 4 from 3 to 7
move 4 from 5 to 1
move 21 from 8 to 6
move 7 from 3 to 2
move 1 from 5 to 1
move 4 from 8 to 9
move 16 from 6 to 1
move 1 from 8 to 4
move 5 from 9 to 2
move 7 from 1 to 7
move 10 from 1 to 3
move 1 from 4 to 2
move 6 from 6 to 5
move 6 from 1 to 4
move 4 from 7 to 9
move 1 from 6 to 5
move 5 from 7 to 6
move 3 from 6 to 8
move 1 from 7 to 6
move 6 from 4 to 8
move 4 from 8 to 3
move 4 from 8 to 4
move 17 from 2 to 1
move 8 from 3 to 4
move 5 from 4 to 3
move 10 from 1 to 5
move 11 from 3 to 5
move 1 from 7 to 9
move 3 from 6 to 4
move 9 from 4 to 9
move 7 from 1 to 3
move 1 from 4 to 8
move 7 from 5 to 4
move 18 from 5 to 1
move 13 from 1 to 6
move 1 from 1 to 5
move 1 from 1 to 6
move 2 from 3 to 1
move 1 from 3 to 1
move 5 from 1 to 6
move 4 from 5 to 8
move 2 from 4 to 9
move 1 from 1 to 9
move 6 from 3 to 8
move 1 from 4 to 5
move 10 from 8 to 7
move 16 from 6 to 7
move 1 from 5 to 4
move 1 from 7 to 2
move 2 from 2 to 6
move 2 from 8 to 5
move 5 from 4 to 9
move 2 from 5 to 9
move 7 from 9 to 8
move 2 from 6 to 9
move 4 from 8 to 9
move 7 from 9 to 7
move 13 from 9 to 5
move 10 from 5 to 1
move 3 from 8 to 4
move 5 from 1 to 3
move 3 from 5 to 6
move 3 from 9 to 7
move 1 from 1 to 7
move 2 from 1 to 3
move 1 from 6 to 1
move 4 from 3 to 8
move 1 from 8 to 9
move 1 from 8 to 7
move 1 from 8 to 4
move 1 from 9 to 7
move 1 from 8 to 5
move 2 from 4 to 3
move 4 from 6 to 3
move 1 from 5 to 1
move 1 from 6 to 4
move 2 from 4 to 5
move 1 from 4 to 6
move 1 from 6 to 4
move 30 from 7 to 3
move 1 from 5 to 1
move 6 from 7 to 3
move 2 from 1 to 7
move 2 from 1 to 2
move 2 from 2 to 1
move 1 from 4 to 9
move 3 from 1 to 2
move 1 from 9 to 5
move 2 from 7 to 1
move 1 from 7 to 3
move 1 from 1 to 9
move 1 from 5 to 8
move 1 from 1 to 2
move 1 from 7 to 3
move 1 from 9 to 4
move 18 from 3 to 4
move 1 from 5 to 9
move 1 from 9 to 6
move 1 from 2 to 7
move 1 from 8 to 7
move 1 from 6 to 3
move 1 from 7 to 2
move 14 from 4 to 6
move 1 from 7 to 6
move 15 from 6 to 4
move 20 from 3 to 1
move 5 from 4 to 9
move 5 from 4 to 2
move 15 from 1 to 7
move 11 from 7 to 9
move 2 from 7 to 6
move 1 from 6 to 4
move 1 from 6 to 3
move 2 from 7 to 8
move 10 from 4 to 3
move 15 from 9 to 3
move 1 from 9 to 7
move 29 from 3 to 6
move 3 from 1 to 6
move 1 from 8 to 4
move 2 from 4 to 3
move 1 from 8 to 9
move 4 from 6 to 1
move 20 from 6 to 2
move 5 from 1 to 9
move 3 from 6 to 2
move 4 from 6 to 3
move 4 from 3 to 1
move 4 from 1 to 4
move 3 from 4 to 8
move 6 from 3 to 4
move 6 from 2 to 6
move 1 from 7 to 1
move 3 from 6 to 8
move 6 from 9 to 3
move 1 from 1 to 4
move 1 from 1 to 7
move 3 from 4 to 5
move 2 from 6 to 4
move 2 from 5 to 6
move 4 from 8 to 7
move 1 from 5 to 6
move 1 from 8 to 4
move 1 from 8 to 4
move 2 from 4 to 9
move 4 from 7 to 8
move 4 from 4 to 3
move 1 from 7 to 9
move 4 from 8 to 6
move 1 from 3 to 4
move 1 from 3 to 5
move 2 from 4 to 7
move 4 from 6 to 3
move 2 from 9 to 1
move 2 from 7 to 4
move 1 from 5 to 1
move 1 from 3 to 4
move 1 from 9 to 3
move 4 from 4 to 5
move 2 from 5 to 3
move 1 from 5 to 7
move 1 from 5 to 8
move 2 from 6 to 4
move 3 from 1 to 3
move 21 from 3 to 5
move 3 from 6 to 1
move 1 from 7 to 1
move 4 from 2 to 6
move 1 from 8 to 2
move 10 from 2 to 4
move 4 from 1 to 2
move 1 from 6 to 5
move 2 from 6 to 9
move 7 from 4 to 9
move 1 from 6 to 5
move 3 from 9 to 4
move 6 from 2 to 8
move 3 from 9 to 1
move 8 from 4 to 3
move 1 from 9 to 4
move 21 from 5 to 7
move 1 from 1 to 3
move 2 from 9 to 6
move 14 from 7 to 1
move 2 from 4 to 1
move 2 from 8 to 7
move 1 from 8 to 2
move 11 from 2 to 9
move 8 from 9 to 6
move 4 from 7 to 1
move 1 from 7 to 4
move 2 from 3 to 5
move 1 from 1 to 6
move 1 from 8 to 2
move 3 from 7 to 5
move 6 from 1 to 7
move 1 from 8 to 7
move 1 from 4 to 5
move 4 from 6 to 5
move 6 from 7 to 6
move 3 from 9 to 1
move 1 from 7 to 3
move 11 from 5 to 1
move 1 from 5 to 2
move 9 from 6 to 4
move 1 from 7 to 3
move 2 from 6 to 1
move 1 from 2 to 1
move 1 from 2 to 6
move 14 from 1 to 5
move 1 from 8 to 4
move 10 from 1 to 5
move 3 from 5 to 1
move 8 from 3 to 8
move 16 from 5 to 7
move 2 from 1 to 9
move 3 from 8 to 1
move 1 from 2 to 4
move 6 from 7 to 4
move 3 from 5 to 8
move 2 from 3 to 6
move 7 from 1 to 7
move 14 from 4 to 3
move 9 from 7 to 8
move 2 from 4 to 1
move 9 from 8 to 4
move 7 from 8 to 2
move 6 from 1 to 8
move 1 from 9 to 7
move 1 from 1 to 6
move 1 from 9 to 6
move 1 from 5 to 9
move 1 from 5 to 3
move 9 from 4 to 9
move 3 from 3 to 6
move 8 from 6 to 3
move 1 from 2 to 9
move 8 from 9 to 8
move 6 from 2 to 9
move 2 from 6 to 1
move 7 from 8 to 6
move 2 from 9 to 6
move 8 from 7 to 8
move 1 from 4 to 5
move 9 from 3 to 5
move 2 from 1 to 4
move 1 from 7 to 4
move 2 from 4 to 3
move 11 from 8 to 1
move 1 from 4 to 7
move 1 from 7 to 8
move 5 from 1 to 3
move 4 from 6 to 4
move 2 from 4 to 8
move 1 from 4 to 8
move 7 from 8 to 9
move 1 from 8 to 9
move 1 from 8 to 5
move 18 from 3 to 2
move 17 from 2 to 7
move 6 from 5 to 4
move 1 from 2 to 5
move 4 from 4 to 6
move 4 from 6 to 9
move 15 from 7 to 9
move 2 from 1 to 6
move 2 from 7 to 9
move 28 from 9 to 2
move 1 from 6 to 7
move 4 from 6 to 9
move 3 from 1 to 7
move 2 from 6 to 3
move 1 from 4 to 7
move 8 from 9 to 5
move 13 from 5 to 3
move 1 from 5 to 7
move 3 from 9 to 4
move 8 from 3 to 7
move 28 from 2 to 5
move 1 from 9 to 8
move 4 from 3 to 4
move 4 from 7 to 5
move 2 from 3 to 9
move 21 from 5 to 4
move 1 from 5 to 7
move 1 from 3 to 5
move 3 from 5 to 7
move 1 from 1 to 3
move 3 from 7 to 3
move 5 from 7 to 6
move 10 from 4 to 8
move 6 from 5 to 4
move 1 from 9 to 3
move 15 from 4 to 5
move 10 from 4 to 7
move 3 from 3 to 7
move 1 from 3 to 4
move 1 from 3 to 4
move 7 from 5 to 1
move 2 from 4 to 7
move 1 from 9 to 2
move 2 from 6 to 9
move 1 from 5 to 3
move 1 from 3 to 8
move 10 from 7 to 9
move 2 from 8 to 1
move 9 from 9 to 2
move 1 from 4 to 3
move 9 from 8 to 7
move 1 from 2 to 8
move 5 from 5 to 4
move 1 from 3 to 2
move 5 from 4 to 3
move 3 from 5 to 9
move 6 from 7 to 3
move 1 from 6 to 5
move 5 from 9 to 7
move 2 from 5 to 6
move 3 from 6 to 7
move 4 from 1 to 4
move 6 from 2 to 7
move 17 from 7 to 5
move 1 from 6 to 1
move 5 from 3 to 6
move 10 from 7 to 2
move 1 from 8 to 4
move 1 from 9 to 8
move 3 from 4 to 1
move 1 from 7 to 4
move 5 from 5 to 9
move 2 from 8 to 7
move 3 from 3 to 7
move 4 from 2 to 3
move 3 from 4 to 6
move 7 from 5 to 8
move 7 from 2 to 8
move 4 from 9 to 8
move 12 from 8 to 3
move 17 from 3 to 2
move 1 from 7 to 9
move 1 from 3 to 9
move 3 from 9 to 1
move 2 from 5 to 1
move 1 from 3 to 5
move 4 from 5 to 8
move 6 from 8 to 1
move 17 from 2 to 3
move 13 from 3 to 2
move 1 from 3 to 9
move 1 from 8 to 4
move 1 from 4 to 8
move 1 from 9 to 1
move 2 from 7 to 2
move 8 from 6 to 2
move 2 from 7 to 5
move 9 from 1 to 3
move 13 from 2 to 9
move 6 from 1 to 4
move 6 from 4 to 5
move 3 from 8 to 1
move 2 from 1 to 8
move 8 from 5 to 7
move 2 from 3 to 1
move 9 from 3 to 1
move 3 from 8 to 2
move 1 from 1 to 9
move 1 from 3 to 9
move 6 from 7 to 3
move 4 from 2 to 7
move 14 from 1 to 6
move 2 from 3 to 9
move 3 from 3 to 7
move 6 from 2 to 1
move 2 from 1 to 2
move 9 from 6 to 3
move 11 from 9 to 5
move 9 from 7 to 6
move 6 from 6 to 2
move 1 from 1 to 8
move 5 from 9 to 4
move 1 from 8 to 5
move 9 from 2 to 7
move 10 from 5 to 8
`;

  type output = [day5part1<input>, day5part2<input>];
}
