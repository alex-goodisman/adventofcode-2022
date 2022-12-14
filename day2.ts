namespace day2 {
  // integer string adder (this is copypasted from day 1)

  // string to num (for use in adding individual digits)
  type parseNum<S extends string> = S extends `${infer N extends number}`
    ? N
    : never;

  // num to array (for adding)
  type ofLength<N extends number, C extends null[] = []> = C["length"] extends N
    ? C
    : ofLength<N, [null, ...C]>;

  // number adder
  type sum<A extends number, B extends number, C extends boolean = false> = [
    ...ofLength<A>,
    ...ofLength<B>,
    ...(C extends true ? [null] : [])
  ]["length"];

  // only call with one- or two-digit numbers - returns [digit, carry]
  type numToDigit<N> = N extends number
    ? `${N}` extends `${infer _}${infer H}${infer T}`
      ? [`${H}${T}`, true]
      : [`${N}`, false]
    : never;

  // add digit strings (1 char each)
  type addDigit<
    A extends string,
    B extends string,
    C extends boolean = false
  > = numToDigit<sum<parseNum<A>, parseNum<B>, C>>;

  // add strings in reverse order:
  type addReversed<
    A extends string,
    B extends string,
    C extends boolean = false,
    P extends string = ""
  > = A extends `${infer HA}${infer TA}`
    ? B extends `${infer HB}${infer TB}`
      ? addDigit<HA, HB, C> extends [
          infer S extends string,
          infer C2 extends boolean
        ]
        ? addReversed<TA, TB, C2, `${P}${S}`>
        : never
      : addDigit<HA, "0", C> extends [
          infer S extends string,
          infer C2 extends boolean
        ]
      ? addReversed<TA, "", C2, `${P}${S}`>
      : never
    : B extends `${infer HB}${infer TB}`
    ? addDigit<"0", HB, C> extends [
        infer S extends string,
        infer C2 extends boolean
      ]
      ? addReversed<"", TB, C2, `${P}${S}`>
      : never
    : C extends true
    ? `${P}1`
    : P;

  // reverse a string
  type reverse<
    S extends string,
    R extends string = ""
  > = S extends `${infer H}${infer T}` ? reverse<T, `${H}${R}`> : R;

  // string adder
  type addStrings<A extends string, B extends string> = reverse<
    addReversed<reverse<A>, reverse<B>>
  >;
  // --end copypaste

  // addition type that works (we are going to be adding four digit numbers together soon and we will need this)
  type addNumbers<A extends number, B extends number> = parseNum<
    addStrings<`${A}`, `${B}`>
  > extends infer P extends number
    ? P
    : never;

  // input processing

  // since the input data is well formed, we can chunk it easily to avoid max recursion depth
  type chunkOnce<
    S extends string,
    D extends string = "",
    C extends null[] = []
  > = C["length"] extends 300 //repeating unit is 4 characters so arbitrarily chunk it into groups of 300
    ? [D, S]
    : S extends `${infer H}${infer T}`
    ? chunkOnce<T, `${D}${H}`, [null, ...C]>
    : [D, ""]; // last chunk has the leftovers

  type chunkAll<
    S extends string,
    D extends string[] = []
  > = chunkOnce<S> extends [infer C extends string, infer R extends string]
    ? R extends ""
      ? [...D, C]
      : chunkAll<R, [...D, C]>
    : never;

  // the input data is very long so we have to stay chunked until the end
  // therefore every operation needs a regular version and a mapped version
  // because typescript doesn't support HKTs

  // trim leading and trailing newlines.
  type trim<S extends string> = S extends `\n${infer T}`
    ? trim<T>
    : S extends `${infer T}\n`
    ? trim<T>
    : S;

  type mapTrim<S extends string[], R extends string[] = []> = S extends [
    infer H extends string,
    ...infer T extends string[]
  ]
    ? mapTrim<T, [...R, trim<H>]>
    : R;

  // split on a separator character. since we are mapping this over each chunk, we don't need to avoid recursion here.
  // since the chunk size is bounded
  type splitOn<
    P extends string,
    S extends string,
    C extends string = "",
    R extends string[] = []
  > = S extends `${infer H}${infer T}`
    ? H extends P
      ? splitOn<P, T, "", [...R, C]>
      : splitOn<P, T, `${C}${H}`, R>
    : [...R, C];

  type mapSplitOn<
    P extends string,
    S extends string[],
    R extends string[][] = []
  > = S extends [infer H extends string, ...infer T extends string[]]
    ? mapSplitOn<P, T, [...R, splitOn<P, H>]>
    : R;

  // split on space specifically to exactly two characters (since input is of the form "X A")
  type mapSplitSpace<
    S extends string[],
    R extends [string, string][] = []
  > = S extends [infer H extends string, ...infer T extends string[]]
    ? splitOn<" ", H> extends infer P extends [string, string]
      ? mapSplitSpace<T, [...R, P]>
      : never
    : R;

  type mapMapSplitSpace<
    S extends string[][],
    R extends [string, string][][] = []
  > = S extends [infer H extends string[], ...infer T extends string[][]]
    ? mapMapSplitSpace<T, [...R, mapSplitSpace<H>]>
    : R;

  // convert letters to numbers to do arithmetic with
  type abc = "A" | "B" | "C";
  type parseABC<A extends abc> = { A: 0; B: 1; C: 2 }[A];

  type xyz = "X" | "Y" | "Z";
  type parseXYZ<X extends xyz> = { X: 0; Y: 1; Z: 2 }[X];

  type parsePair<P extends [abc, xyz]> = [parseABC<P[0]>, parseXYZ<P[1]>];

  type mapParsePair<
    S extends [abc, xyz][],
    R extends [number, number][] = []
  > = S extends [infer H extends [abc, xyz], ...infer T extends [abc, xyz][]]
    ? mapParsePair<T, [...R, parsePair<H>]>
    : R;

  type mapMapParsePair<
    S extends [abc, xyz][][],
    R extends [number, number][][] = []
  > = S extends [
    infer H extends [abc, xyz][],
    ...infer T extends [abc, xyz][][]
  ]
    ? mapMapParsePair<T, [...R, mapParsePair<H>]>
    : R;

  //since all of the numbers here are between 0 and 5, just hardcode all the arithmetic beyond addition
  type mod3<N extends number> = [0, 1, 2, 0, 1, 2][N];
  type times3<N extends number> = [0, 3, 6, 9, 12, 15][N];

  // each number beats the one before it (mod 3). numbers are between 0 and 2.
  type computeResult<A extends number, X extends number> = mod3<
    addNumbers<X, 1>
  > extends A
    ? 0
    : X extends A
    ? 1
    : 2;

  // 3 times win result plus (guess + 1)
  type scorePart1<A extends number, X extends number> = addNumbers<
    times3<computeResult<A, X>>,
    addNumbers<X, 1>
  >;

  type mapScorePart1<
    S extends [number, number][],
    R extends number[] = []
  > = S extends [
    [infer A extends number, infer B extends number],
    ...infer T extends [number, number][]
  ]
    ? mapScorePart1<T, [...R, scorePart1<A, B>]>
    : R;

  type mapMapScorePart1<
    S extends [number, number][][],
    R extends number[][] = []
  > = S extends [
    infer H extends [number, number][],
    ...infer T extends [number, number][][]
  ]
    ? mapMapScorePart1<T, [...R, mapScorePart1<H>]>
    : R;

  // sum all. this will be used to collapse the chunks at the end as well.
  type arraySum<S extends number[], R extends number = 0> = S extends [
    infer H extends number,
    ...infer T extends number[]
  ]
    ? arraySum<T, addNumbers<H, R>>
    : R;

  type mapArraySum<S extends number[][], R extends number[] = []> = S extends [
    infer H extends number[],
    ...infer T extends number[][]
  ]
    ? mapArraySum<T, [...R, arraySum<H>]>
    : R;

  // put data in common format for both parts
  type data<I extends string> = mapMapParsePair<
    mapMapSplitSpace<mapSplitOn<"\n", mapTrim<chunkAll<I>>>>
  >;

  // score according to part 1
  type day2part1<I extends string> = arraySum<
    mapArraySum<mapMapScorePart1<data<I>>>
  >;

  // avoid subtracting 1 by doing (x + 2) % 3
  type computeGuess<A extends number, X extends number> = X extends 1
    ? A
    : mod3<addNumbers<A, X extends 2 ? 1 : 2>>;

  type scorePart2<A extends number, X extends number> = addNumbers<
    times3<X>,
    addNumbers<computeGuess<A, X>, 1>
  >;

  type mapScorePart2<
    S extends [number, number][],
    R extends number[] = []
  > = S extends [
    [infer A extends number, infer B extends number],
    ...infer T extends [number, number][]
  ]
    ? mapScorePart2<T, [...R, scorePart2<A, B>]>
    : R;

  type mapMapScorePart2<
    S extends [number, number][][],
    R extends number[][] = []
  > = S extends [
    infer H extends [number, number][],
    ...infer T extends [number, number][][]
  ]
    ? mapMapScorePart2<T, [...R, mapScorePart2<H>]>
    : R;

  // score according to part 2
  type day2part2<I extends string> = arraySum<
    mapArraySum<mapMapScorePart2<data<I>>>
  >;

  type input = `
A Y
B Y
B Z
B Z
A Y
C Y
A Y
C Y
A Y
B X
B Y
B Z
A Y
A Y
C Y
C Y
A Y
C Y
B Y
A Y
A Y
C Y
C X
A Y
B Z
C Y
A Y
C Y
A Y
C Y
A Z
A Y
C Y
B Y
A Y
C Y
B X
B Z
C X
B Z
B X
C Y
B Z
A Y
C Y
B X
A Y
A Z
B Y
C Y
A X
C X
C Y
C Y
A Y
C X
A Y
C X
C Y
C Y
A Y
C Y
A Z
A Y
B Z
A Y
A Y
B X
A Y
B Y
A Y
B X
B Y
C Y
A Y
B X
A Y
C X
B Y
A Y
B Z
C Y
C Y
B Y
B Z
B Z
B Y
B Y
A Y
A Y
A Z
C Y
B X
A Y
B Y
A Y
B X
C Y
A Z
C Y
C Y
A Y
A Y
C Y
C Y
B X
A Y
A Y
B X
A Y
C Y
B Z
A Y
B Z
C Y
C X
C Y
B Z
C Y
A Y
A Y
B Y
C X
A X
B X
A Y
C Y
C Y
A Y
A Y
C Y
C Y
A Z
B X
C Y
B X
A Y
C Y
A Y
A Z
C Y
A Y
A Y
A Y
C Y
B X
C Y
A Y
A X
C Y
A Y
B X
C Y
A Y
A Y
B Y
A Y
A Y
C Y
B Y
B X
A Y
A Y
B X
A Y
C Y
A X
C Y
C Y
A Y
B Z
A Y
A Y
C Y
A Y
A Y
C Y
A Z
B Z
A Y
C Y
B X
B X
A Y
A Y
C Y
A Y
A Y
C Y
B Z
B Z
B Y
B Y
A Y
A Y
A Y
A Y
A Y
C X
A Y
A Y
A Y
B Z
C Y
A Y
B Z
A Y
A Y
A Y
B Z
A Z
C X
B X
B Z
B Y
B Y
C Y
C Y
B Y
A Y
C Y
A Y
A Y
C Y
B X
A Y
A X
A Y
A Y
B Z
C Z
A Y
B X
C Y
C Y
A Y
A Z
A Y
C Y
C Y
C Y
A Y
A Y
C Y
C Y
A Y
A Y
A X
A Y
C Y
B X
B Z
C Y
A Y
A X
A Y
C X
C Y
B Z
B Y
A Y
C X
C Y
C Y
C X
C Y
B X
A Y
A Y
A Y
A Z
C Y
A Y
C Y
A Y
B Y
C X
A Y
A Y
A Y
C Y
B Z
A Y
C X
B Y
A Y
B Z
A Y
C Y
C Y
A Y
B Z
C Y
A Z
C Y
A Y
B X
A Y
A Z
A Z
A Z
C Y
C Y
A Z
B Y
A Z
A Y
C X
C Y
A Y
A Y
B Y
A Y
A Y
A Y
B Y
C Y
A Y
C Y
A Y
C X
A Y
A Z
A Y
A Y
A Y
C Y
A Y
C Y
A Y
A Y
C X
A Y
C Y
B Z
C Y
A Y
B Y
A Z
C Y
B Y
A Y
A Y
A Y
A Y
A Y
B Z
B Z
B Z
A X
A Y
B Z
A Y
A Y
C Y
C Y
B Z
A Y
B X
C Y
A Y
A Y
B Y
C Y
B Z
A Y
A Y
A Y
B X
B Y
C Y
A Y
A Y
B X
A Y
B Z
C X
C X
A Y
C Z
C Y
C Y
A Z
B Z
C Y
A Y
A Y
C Y
C Y
C Y
A Y
A X
B Z
A Y
A Y
B Y
B Y
C Y
B Y
B Y
B Z
C Y
C Y
B Y
A Y
C Y
A Y
A Y
B Y
A Y
A X
A Y
B Y
A Y
B Y
C Y
A Y
B Z
A Y
B Y
A Y
A Y
C X
C Y
C X
A Z
C Z
B Y
B Y
C Y
B Y
A Y
A Y
B Y
C Y
C Y
C Y
A Y
B Z
B X
C Y
C Y
A Z
A Z
A Y
A Y
A Y
B Y
A Y
B Y
A Y
B Z
A Z
B Y
C Y
C Y
C Z
B Z
B Y
B X
A Y
B X
B X
B Y
C Y
B Z
A Y
C Y
A Y
C Z
B Y
A Y
A Y
C Y
B Y
C Y
B Y
B Y
A Y
A Y
A Z
C X
A Y
A Y
C Y
A Y
B Z
A Y
A Y
A Y
C Z
C Y
B Z
C Y
B Z
A Y
B Z
B Y
A Y
B Y
A Y
A Y
A Y
A Y
C Y
C Y
C Z
B Y
C Y
C Y
A Y
A Z
A Y
B Z
A Y
C Y
C Y
A Y
A Y
A Y
B Z
A Z
A Y
A Y
A Y
A Y
A Y
B Z
B Z
A Y
A Y
B Z
A Z
A Z
A Y
B Y
B Y
B Z
A Y
B Z
C Y
B Z
B Y
A Y
A Y
C Y
C Y
C Y
A Y
A Y
C Y
C X
C Y
A Y
B Z
A Y
B X
B Y
B Y
B X
A Y
A Z
C Y
B Z
C Y
A Z
A Y
A Y
A Y
C Y
C X
A Y
C Y
A Y
B Z
C Y
A Y
B Z
A Y
C Y
A Y
C Y
B Y
C Y
B X
A Y
A Z
C Y
A Y
C X
C Y
A Y
C Y
A Y
C Y
A Z
B Y
A Y
B Z
C Y
C Z
A Y
A Y
A Z
A Y
A Y
C Y
B Y
C Z
A Y
B Y
C X
B Z
C Y
C Y
B Z
B Z
A Y
B Y
C Y
B Y
C Y
B Y
A Z
C Y
B Z
A Y
A Y
C Y
A Y
B Z
A Y
A Y
C Y
C Y
A Z
A Y
A X
C Y
B Y
B Y
B Z
B Y
B Y
C Y
A Y
C Y
A Y
A Y
B X
C Y
B X
A Y
A Y
B Y
B Z
C Y
A Y
C Y
A Y
A Y
C Y
B Y
C Y
B Y
B X
C Y
A Y
A Y
B Z
B Y
B Y
A Y
A Y
A Y
A Y
A Y
C Y
A Y
A Y
C Y
A Y
B Y
C Y
A Y
A Y
A Y
C Y
A Y
B Y
B Y
A Z
A Y
C Y
B Y
C Y
A Z
B Z
A X
B Y
B Z
A Y
A Y
C Y
B Y
A Y
B Z
A Z
C Y
C Y
A Y
B X
C Y
A Y
C Y
C Y
B Z
A Y
A Y
A Y
C Y
A Y
C Y
B Y
B Y
B Y
A Z
C X
B X
C Y
A Y
A Y
A Y
A Y
C Y
A Y
B Y
A Y
C Z
C Y
A Z
B Y
A Y
C Z
C X
B Y
C X
A Y
B Z
A X
B Y
B Y
B X
C X
A Z
C Y
B Y
C Y
A Z
C Y
C Y
C Y
A Y
A Y
A Y
C Y
A Y
A Y
C X
B Z
C Y
C Y
B Z
C Y
B Y
B Z
A Y
B X
A Y
C Y
A Y
A Y
A Y
A Y
B Z
C Y
C Y
B Z
B Y
C Y
C Z
C Y
C Y
B Y
A Y
A Y
A Y
A Z
C Y
A Y
A Y
C Y
A Y
A Y
B Y
A Y
A X
A Y
A Z
B Y
C Y
A Y
A Y
C Y
A Y
B Z
B Z
C Y
C Y
A Y
A Y
B Z
B Z
A Y
B Y
C Y
A Y
B Y
C Y
A Y
C Y
B X
A Y
A Y
A Y
A Y
A Y
B X
C Y
C Y
B Y
A Y
C Y
B Y
C Z
C Y
B X
C Y
A Y
C Y
C Y
C Y
C Y
B X
A Y
C Y
A X
A Y
C X
A X
C X
C Y
A X
C Y
C Z
C Y
A Y
A Y
A Z
C Y
C Y
B Z
A Y
C Y
A Y
A Y
B Z
C Z
A Y
A Y
C Y
A Y
A Y
B Y
A X
A Y
B Z
A X
C Y
B X
A Y
A Z
C Y
B Z
B Y
B Y
A X
A Z
B Z
C X
C Y
B X
B Z
C Y
C Y
C Y
A Y
C Y
B X
C Y
A Y
A Y
A X
C Z
B Z
C Z
C Y
B Y
C Y
A Y
A Y
C Y
C Y
B Y
C Y
C Y
C Y
A Y
B X
A Y
B Y
C Y
B X
C Y
C Y
B Y
A Y
B Y
B Y
C Y
A Y
B X
C X
C Y
B X
A Y
A Y
B Z
B Y
A Y
B Y
B Y
A Z
B X
B Z
C Y
B Y
C Y
A Y
A Y
B X
A Y
C X
B Y
B Z
B X
C X
C Y
C X
A Y
C Y
B Y
B Y
A Y
B X
C Y
C Y
B X
B X
C Y
B Z
B Y
A Y
C Y
B X
C Y
A Y
A Z
A Y
A Y
C Y
A Z
A Y
B Z
A Y
B Y
B X
B Z
B Y
C Y
A Y
A Y
C X
B Y
A Y
B Y
A Y
C Y
C Y
A Y
B Y
B Y
B Y
C Y
A Y
B Y
B X
B X
A Y
C Y
C Y
A Y
A Y
A Y
A Z
C Y
A Y
C Y
A Y
B Z
C Y
C X
C Y
A Y
C X
B Z
C X
A Y
B X
A Y
C Z
C X
A X
A Y
C Y
B X
A X
B Y
A Y
A Y
A Y
C X
A Z
B Z
C Y
A Y
C Y
C Y
C X
C Y
B Y
C Y
B Z
B Z
C Y
B Y
A Y
A Y
A Y
B Y
C Y
A Y
A Y
C Y
B Y
B Y
C Y
A X
A Y
A Y
A Z
A Y
B Y
C Y
A Y
A Y
A Y
C Y
A Y
B X
A Y
C Y
A Y
A Y
B Z
B Y
B Z
C Y
A Y
A Z
A Y
A Y
B Y
A Y
C Y
C Y
A Y
B Y
C X
B Z
A Y
C Y
B X
B Y
C Y
B Y
C Z
A Z
A Y
C Y
A Y
C Y
C X
A Y
C Y
B X
C Y
A Y
A Y
C Y
A Z
B X
B Z
A Y
B Z
B Y
A Z
B Y
A Y
C Y
A Y
C Y
C Y
A Y
B Y
C Y
A Y
A Y
B X
A Y
A Y
A Y
C Y
A Z
B Y
B X
A Y
B Y
C Y
A Y
C Y
A Z
B X
A Y
A Y
A Y
A Z
A Y
B Y
B Z
B Z
A Y
A Z
A Y
B X
A Y
A Y
A Y
C Y
A Y
A Y
A Z
C Y
A Y
A Y
B X
B Y
C Y
B X
C Y
A Y
B Y
A Y
C Y
C Y
C Y
C Y
A Y
C Y
C Y
B Y
A Y
C Y
A Y
A Y
B Y
A Y
B Y
C X
A Y
A Y
A Y
C Y
B Z
C Y
A X
A Y
A Z
A Y
B X
C X
A Y
B Y
A Y
A Y
B Y
A Y
C Y
A Y
A Y
B Z
C Y
A Y
A X
B Z
A Y
A Y
A Z
C Y
A Z
C Y
B Y
A Y
C X
B X
A Y
C X
C X
A Y
A Y
A X
A Y
A Y
A Y
B Y
C X
A Y
C Y
C Y
A Y
B Z
A Y
C Y
B Z
A Y
C Y
C Y
B X
B Y
B Z
A Y
C Z
C Y
A Y
C X
A Y
C X
B Z
A Y
B Y
A Y
C Y
B Y
A Y
B Y
B X
A Y
B Y
C Y
A Y
C Y
C Y
A X
C Y
C X
A X
A Y
C Y
C Y
C X
C X
C Y
C Y
C Y
A Z
A Y
B Z
C Y
C Y
A Z
A Y
A Y
C X
A Y
A Y
A Y
C Y
A Y
C Y
A Y
A Y
A Y
C Y
C Y
A Y
B Y
B Y
A Z
B X
B X
B Y
C Y
A Y
A X
A Y
B X
C Y
B X
C X
C Y
A Y
A Y
C Y
A Y
C Y
A Y
B Z
C Y
A Y
B Y
A Y
A Y
A Y
A Y
A Z
C Y
A Y
B Y
C Y
C Y
A Y
C X
A Y
A Y
C Y
C Y
C X
B Y
A Y
A Y
A Y
A Y
C Y
A Y
B X
A Z
A Y
C Y
B X
A Y
C Y
A Y
A Y
A Y
C Y
B Y
A Y
A Y
B Z
C Y
C X
A Y
A Y
C Y
A Y
C X
C Y
C Y
A Y
C Y
C Y
C Y
C X
A Y
A Y
A Y
A Y
C Y
B Y
C Y
A Y
A Z
B Z
A Y
B Y
B Z
C Y
A X
B Y
C Y
A Y
A Y
C Y
A Y
A Y
A Z
B Z
C X
B Y
B Y
C Y
C Y
C Y
A Y
A Y
A Y
A Y
C Z
B Y
B Z
C Y
C Y
A Y
B Y
C Y
A Y
A X
B X
C Y
A Y
C Y
C X
C Y
A Y
A Y
B Y
B X
A Y
C Y
A Z
B X
C Y
B X
A Y
B Z
A Y
A Y
B Y
B Z
B X
A Y
B X
B Z
A Y
C Y
A Y
A Y
A Z
B X
A Y
A Y
B Y
A Y
B Z
B X
C Y
C X
C X
C X
A X
A Y
A Y
A Y
B Y
A Y
A Y
A Y
C Y
B Y
B X
B Y
C Y
A Z
A Y
B Z
A Y
C Y
A Y
A Z
B Z
C Y
B Z
A Y
C Y
B Y
C Y
A Y
C Y
B Z
B Y
B X
C X
A Y
A X
B X
C Y
C Y
A Y
C Y
B Y
A Y
B Z
A Y
B X
A Y
C Y
A Y
C Y
C Y
A Y
A Y
A Y
C X
B Y
B Z
B Y
A Y
A Y
A Z
B X
A Y
A Z
C Y
B Z
B X
A Y
C Y
A Y
B Z
A Y
A Z
B Y
C X
A Y
C Y
C Y
C Y
C Y
A Y
A Y
B Y
A Y
C Y
A Y
B Z
C Y
A Z
C Y
A Y
A Z
C Y
B X
C Y
C Y
A Y
A Y
B Z
B Y
B X
A Y
A Y
B Y
A Y
A Y
B X
B Y
A Y
C Y
A Y
C Y
C Y
B Y
B Y
C Y
A Y
A Z
A Y
A Y
A Y
C Y
C X
B Z
C Y
A Y
A Y
C Y
A Y
A Y
A Z
C X
C Y
A Y
A Y
C Y
C Y
A Y
A Y
C Y
C X
A Y
A Y
B Y
A Z
B Y
A Y
B Z
C Y
C Y
A Y
B Y
A Y
C Y
B Z
A Y
A Y
C X
C Y
C X
A Y
A Y
A Y
B Y
C X
A Y
B X
B Y
C Y
A Y
C Y
A Y
A Y
C Y
A Z
A Y
C X
A Y
A Y
C Y
C Y
C X
A Y
A Y
C Y
B Y
A Y
C Y
A Y
B Z
A Y
C Y
A Y
A Y
A Z
A Y
B Z
A Y
A Y
A Y
A Y
A Y
C Z
C X
A Y
A Z
C Y
C Y
B Z
A Y
B X
A Y
A Y
A Z
B Z
A Y
A Y
C Y
A Y
C Y
B Z
B X
C X
A Y
B Y
C Y
C X
B Y
C Y
A Y
A Y
A Y
A Z
B Y
A Y
C Y
A Y
A Y
A Y
A Y
C Y
C Y
A Y
A Z
C Y
B Y
C Y
C Y
B Y
A Y
C Y
B Z
A Y
A Y
B Z
C Y
B Z
C Y
C Y
B Z
B Y
A Y
C X
C Y
B Y
A Y
A Y
A Y
B Z
A Y
B Y
A Y
C Y
A Y
A Y
C Y
A Z
A Y
C Y
B Y
A Y
B Z
C Y
A Y
A Y
C Y
B Z
B Z
A Y
A Y
A Y
A Y
A Y
C Y
A Y
A Y
A Y
A Y
C Y
A Y
C Y
B X
B Y
A Y
C Z
B Y
C Y
C Y
A Y
C Y
C Y
A Y
A Y
A Y
A Y
B X
B Z
C Y
B X
B Y
B Y
B Z
B X
A Y
A Y
B Y
B X
A Y
A Y
C Y
C X
A Y
B Y
A Y
B Y
B Y
B Y
C Y
A Y
A X
A Y
C Y
B X
B Y
A Y
A X
C Y
C X
A Y
A Y
A Y
B Y
C X
A Z
B Z
A Y
B Z
A Y
A Y
A Y
A Y
B X
A Y
C Z
C Y
C Y
C Y
B Z
A Y
A Y
B Z
B Y
A Z
A Y
A Y
B Z
C Y
A Y
C Y
C Y
C Y
B X
B Y
A Y
A Y
A Y
A Y
B Y
A Y
B Z
B Z
A Y
C Y
C Y
C Y
A Y
C Y
B Y
C Y
A Y
B Y
B Y
B X
C X
A Y
A Y
A Y
B Y
C Y
B Y
C X
B Y
B Y
A Z
C Z
C X
B Y
C Y
B Y
C Y
B Z
A Y
C Y
A Y
B Y
C Y
A Y
A Y
C Z
B X
A Z
C Y
C Y
A Y
B Z
B Y
C X
A Y
B Z
A Y
A Y
A X
A Y
B Y
C Y
B Y
A Y
A Y
B Y
C Y
B Y
A Y
A Y
B Y
C Y
B Y
C Y
B Y
B Y
B X
A Y
A Y
C X
A Y
C Y
B Z
A Y
B Y
A Z
A Y
A Y
B Y
C Y
B Z
A Z
A Y
B Z
C Y
A Y
A Y
A Y
C X
C Y
A Y
C Y
A Y
A Y
B Z
A Y
A Z
C Y
C Y
A X
C X
A Y
B Z
A Y
A Y
B Y
A Y
A Y
B Z
A Y
B Y
B Z
A Y
A Z
A Y
A Z
C Y
B Y
A Y
A Y
B Z
C X
C Y
A Y
A Y
A Y
A Y
A Y
A Z
C Y
B X
A Z
B Y
A Y
A Z
A Y
C X
A Y
A Y
C Z
B Y
C Y
C Y
B Y
C X
A Y
A Y
B Y
A Y
A Y
A Y
B Y
B Y
C Y
A Y
A Y
B Y
B X
A Y
A Y
C Y
B Y
C Y
B Z
A Z
C X
B X
A Y
A Y
A Y
C Z
A Y
C Y
B Y
A Y
B X
A Y
C Y
A Y
B Y
A Y
B X
B Y
A Y
C Y
C Y
A Y
A Y
A Y
A Y
C Y
C Y
A Y
A Y
B Y
C Y
B Z
C Y
C Y
C Z
A Z
B X
C Y
A Y
B Y
B Y
A Y
B X
A Y
B Y
B X
C Y
B X
B Y
B Y
B Z
A Y
A Z
B Z
A X
C Y
B X
C X
A Y
B Z
A Y
A Y
A Z
C X
A Y
B Y
B Y
A Y
A Z
A Y
B X
B X
A Y
B Y
C Y
A Y
B X
B Z
B Z
B Z
C X
A Y
C Y
A Z
B Y
B Y
A Y
B Y
C Y
A Y
A Z
B X
C Y
C Y
A X
C Y
C Y
B Y
B X
C X
A Y
C X
C Y
A Y
B Y
A Y
A Y
B Z
C Y
B X
A X
C Y
B X
C Y
C Y
A Y
C Y
C Y
C X
A Y
A Y
B Y
C Y
C Y
A Y
C Y
A Z
A Y
A Y
B X
A Y
A Y
A Y
A Y
A Y
C Y
B Y
B Y
A Y
A Y
B Y
C Y
B Y
A Y
A Y
B Z
C X
A Y
C Y
B Y
B X
A X
A Y
B Y
B X
B Y
A Y
C Y
A Z
B Y
C Y
C Y
B Z
C Y
C Y
C Y
C Y
C Y
A Y
B Z
C Y
C Y
A Z
A Y
B Z
A Y
B X
C Y
C X
A Y
A Y
B Y
A Z
A Y
C Z
A Y
B Y
A Y
B X
A Y
B Z
C Y
A Y
A Z
A Y
B Y
A Y
B Z
A Y
A Y
A Y
A Y
C X
A Y
B Z
A Y
B Z
B X
A Y
B Y
C Y
B Z
B Z
C Y
B Z
A Z
A Z
B Z
A Y
C Y
C Y
A Y
C Y
B X
C Y
C Y
B Z
A Y
A Y
C Y
B Y
A Y
C Y
C Y
A Y
B Y
A Y
B Y
A Y
A Y
A Y
C Y
B X
B X
C Y
C Y
B X
A Y
C Y
A Y
B Z
A Z
A Y
C Y
A Y
C Y
A Y
C Y
C Y
C Y
A Z
A Y
C Y
B Y
A Y
A Y
C Y
C Y
A Y
B X
B Y
C Y
B Y
B Z
C Y
A Y
C Y
C Y
C Y
A X
A Y
C X
A Z
C Y
C Y
A Y
C Y
A Y
C Y
A Y
A Y
C Y
B Y
A Y
A Y
A Y
C Y
C Z
A Z
A Y
C Y
A Y
A Z
C Y
A Y
C Y
B Y
A Y
B Y
C Y
B Y
A Y
A Z
A Y
B X
C X
C Y
B Z
C Y
C Y
A Y
B X
B Z
A Y
B Z
B X
A Y
A Y
A Y
B X
C Y
C Y
C Y
C Y
B Z
A Y
B Y
B Z
A Y
A Z
A Y
A Y
A Y
B Z
C Y
A Y
A Y
B Y
C Y
C X
A Y
C Y
A Y
A Y
A Y
C Z
A Z
B Y
A Z
B X
B Y
A X
A Y
A Y
C Y
C Y
B X
A Z
C Y
B Y
C X
A Y
A Y
B Y
C Y
C Y
A Y
C X
A Y
A Y
A Y
A Y
C Y
C Y
A Y
C Y
A Z
A Y
C Y
A Y
B X
C Y
C Y
C Y
B X
B Y
A Y
A Y
A Y
C Y
A Y
A Y
B Y
A Y
A Y
C Y
C Y
A Y
C Y
C Y
C Y
C Y
C Y
B Z
C Z
C Y
B X
B Y
C Y
A Y
A Y
A Y
A Y
B Z
A Y
A Z
C X
A X
A Y
A Y
C X
C Y
B Y
A Y
C Z
B Y
B Y
C Z
C Z
A Y
A Y
A Y
C X
B Y
B Z
A Y
A Y
B Y
C X
B Y
A Y
C Y
B Y
A Y
`;

  type output = [day2part1<input>, day2part2<input>];
}
