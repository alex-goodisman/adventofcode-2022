namespace day10 {
  // input is short so can parse it all at once
  type splitLines<
    S extends string,
    C extends string = "",
    L extends number[] = []
  > = S extends `${infer H}${infer T}`
    ? H extends "\n"
      ? splitLines<
          T,
          "",
          C extends ""
            ? L
            : [...L, C extends `addx ${infer N extends number}` ? N : 0]
        >
      : splitLines<T, `${C}${H}`, L>
    : L;

  // part1

  // state is [total, count, special values]
  type state = [number, number, number[]];

  type initState = [1, 0, []];

  // special numbers to read
  type specialCount = 20 | 60 | 100 | 140 | 180 | 220;

  // run one state transition
  type transition<S extends state, N extends number> = S extends [
    infer T extends number,
    infer C extends number,
    infer S extends number[]
  ]
    ? N extends 0
      ? [
          T,
          addNumbers<C, 1>,
          addNumbers<C, 1> extends specialCount
            ? [...S, multiplyNumbers<T, addNumbers<C, 1>>]
            : S
        ]
      : [
          addNumbers<T, N>,
          addNumbers<C, 2>,
          addNumbers<C, 1> extends specialCount
            ? [...S, multiplyNumbers<T, addNumbers<C, 1>>]
            : addNumbers<C, 2> extends specialCount
            ? [...S, multiplyNumbers<T, addNumbers<C, 2>>]
            : S
        ]
    : never;

  //run all state transition
  type runTransitions<S extends state, N extends number[]> = N extends [
    infer H extends number,
    ...infer T extends number[]
  ]
    ? runTransitions<transition<S, H>, T>
    : S;

  // sum all special values
  type arraySum<A extends number[], B extends number = 0> = A extends [
    infer H extends number,
    ...infer T extends number[]
  ]
    ? arraySum<T, addNumbers<B, H>>
    : B;

  // solutions
  type day10part1<I extends string> = arraySum<
    runTransitions<initState, splitLines<I>>[2]
  >;

  // part 2

  // state is [register, position, curRow, prevRows]
  type crtState = [number, number, string, string[]];
  type crtInitState = [1, 0, "", []];

  // get the char to render at currnet position
  type renderChar<T extends number, C extends number> = [
    C extends addNumbers<T, -1> ? true : false,
    C extends T ? true : false,
    C extends addNumbers<T, 1> ? true : false
  ] extends [false, false, false]
    ? "."
    : "#";

  // run one insn
  type crtTransition<S extends crtState, N extends number> = S extends [
    infer T extends number,
    infer C extends number,
    infer R extends string,
    infer P extends string[]
  ]
    ? N extends 0
      ? C extends 39 //wraparound
        ? [T, 0, "", [...P, `${R}${renderChar<T, C>}`]]
        : [T, addNumbers<C, 1>, `${R}${renderChar<T, C>}`, P]
      : C extends 38 //wraparound at end
      ? [
          addNumbers<T, N>,
          0,
          "",
          [...P, `${R}${renderChar<T, C>}${renderChar<T, addNumbers<C, 1>>}`]
        ]
      : C extends 39 //wraparound in the middle
      ? [
          addNumbers<T, N>,
          1,
          renderChar<T, 0>,
          [...P, `${R}${renderChar<T, C>}`]
        ]
      : [
          addNumbers<T, N>,
          addNumbers<C, 2>,
          `${R}${renderChar<T, C>}${renderChar<T, addNumbers<C, 1>>}`,
          P
        ]
    : never;

  // run all insns
  type runCRTTransitions<S extends crtState, N extends number[]> = N extends [
    infer H extends number,
    ...infer T extends number[]
  ]
    ? runCRTTransitions<crtTransition<S, H>, T>
    : S;

  type day10part2<I extends string> = runCRTTransitions<
    crtInitState,
    splitLines<input>
  >[3];

  // math (copypasted from previous days)

  // integer string adder

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

  // only call with 1- or 2-digit numbers - returns [digit, carry]
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
  type addPosStr<A extends string, B extends string> = reverse<
    addReversed<reverse<A>, reverse<B>>
  > extends infer R extends string
    ? R
    : never;
  // test if strict A<B. uses arraylength compare, only useful for comparing small numbers, this is for comparing digits to build the real lessThan.
  type numericLessThan<
    A extends number,
    B extends number,
    C extends null[] = []
  > = [...C, ...ofLength<B>]["length"] extends A
    ? false
    : [...C, ...ofLength<A>]["length"] extends B
    ? true
    : numericLessThan<A, B, [null, ...C]>;

  // test if strict A<B (both are strings of equal lengths)
  type eqStrLessThan<
    A extends string,
    B extends string
  > = A extends `${infer HA extends number}${infer TA}`
    ? B extends `${infer HB extends number}${infer TB}`
      ? HA extends HB
        ? eqStrLessThan<TA, TB>
        : numericLessThan<HA, HB>
      : false
    : false;

  //length of string
  type stringLength<
    S extends string,
    C extends null[] = []
  > = S extends `${infer _}${infer T}`
    ? stringLength<T, [null, ...C]>
    : C["length"];

  // test if strict A<B (both are strings)
  type strLessThan<
    A extends string,
    B extends string
  > = stringLength<A> extends infer AL extends number
    ? stringLength<B> extends infer BL extends number
      ? AL extends BL
        ? eqStrLessThan<A, B>
        : numericLessThan<AL, BL>
      : never
    : never;

  // test if strict A<B.
  type lessThan<A extends number, B extends number> = strLessThan<
    `${A}`,
    `${B}`
  >;

  // length based A-B. both are positive. returns never if B>A.
  type posDif<A extends null[], B extends null[], C extends null[] = []> = [
    ...B,
    ...C
  ]["length"] extends A["length"]
    ? C["length"]
    : [...A, ...C]["length"] extends B["length"]
    ? never
    : posDif<A, B, [null, ...C]>;

  // A-B with borrowing support. C is true if borrow from previous place. returns [digit, borrow from next]
  type subDigit<
    A extends null[],
    B extends null[],
    C extends boolean = false
  > = C extends true
    ? subDigit<A, [null, ...B], false> //if borrowing, just add 1 to B
    : lessThan<A["length"], B["length"]> extends true
    ? [posDif<[...ofLength<10>, ...A], B>, true]
    : [posDif<A, B>, false];

  // remove all leading zeroes unless the string is exactly '0'
  type stripLeadingZeroes<S extends string> = S extends `0${infer T}`
    ? T extends ""
      ? S
      : stripLeadingZeroes<T>
    : S;

  // perform A-B on strings. They are in reverse order, so 1s place first. A must be >= B
  type subReversed<
    A extends string,
    B extends string,
    C extends boolean = false,
    D extends string = ""
  > = A extends `${infer HA}${infer TA}`
    ? B extends `${infer HB}${infer TB}`
      ? subDigit<ofLength<parseNum<HA>>, ofLength<parseNum<HB>>, C> extends [
          infer E extends number,
          infer C2 extends boolean
        ]
        ? subReversed<TA, TB, C2, `${E}${D}`>
        : never
      : subDigit<ofLength<parseNum<HA>>, [], C> extends [
          infer E extends number,
          infer C2 extends boolean
        ]
      ? subReversed<TA, "", C2, `${E}${D}`>
      : never
    : stripLeadingZeroes<D>;

  // perform A-B on strings. They are forwards. either can be larger but both must be positive.
  type subPosStr<A extends string, B extends string> = strLessThan<
    A,
    B
  > extends true
    ? `-${subReversed<reverse<B>, reverse<A>>}`
    : subReversed<reverse<A>, reverse<B>>;

  // negative to positive
  type isNegative<N extends string> = N extends `-${string}` ? true : false;
  type flipSign<S extends string> = S extends "0"
    ? "0"
    : S extends `-${infer T}`
    ? T
    : `-${S}`;

  // add number strings of any sign (convert to subtraction for negatives)
  type addStrings<A extends string, B extends string> = (
    isNegative<A> extends true
      ? isNegative<B> extends true
        ? flipSign<addPosStr<flipSign<A>, flipSign<B>>>
        : subPosStr<B, flipSign<A>>
      : isNegative<B> extends true
      ? subPosStr<A, flipSign<B>>
      : addPosStr<A, B>
  ) extends infer S extends string
    ? S
    : never;

  type addNumbers<A extends number, B extends number> = parseNum<
    addStrings<`${A}`, `${B}`>
  >;

  //number multiplier: A*B(+C).
  type prod<
    A extends number,
    B extends number,
    C extends number = 0,
    D extends null[] = [],
    E extends number = 0
  > = D["length"] extends B
    ? addNumbers<E, C>
    : prod<A, B, C, [null, ...D], addNumbers<A, E>>;
  // multiply two string digits. return string ones place and number tens place (carry, defaults to 0)
  type numToCarry<N> = N extends number
    ? `${N}` extends `${infer A extends number}${infer H}${infer T}`
      ? [`${H}${T}`, A]
      : [`${N}`, 0]
    : never;
  // multiply two string digits with carry, produces [ones, tens] with string ones and numeric tens
  type prodDigit<
    A extends string,
    B extends string,
    C extends number = 0
  > = numToCarry<prod<parseNum<A>, parseNum<B>, C>>;
  // multiply A, a reversed number string, by B, a single string digit. Returns a string
  type mulReversedByDigit<
    A extends string,
    B extends string,
    C extends number = 0,
    P extends string = ""
  > = A extends `${infer HA}${infer TA}`
    ? prodDigit<HA, B, C> extends [
        infer S extends string,
        infer C2 extends number
      ]
      ? mulReversedByDigit<TA, B, C2, `${S}${P}`>
      : never
    : C extends 0
    ? P
    : `${C}${P}`;
  // multiply A, a reversed number string, by B, a FORWARD number string. returns a string
  type mulReversedByString<
    A extends string,
    B extends string,
    P extends string = ""
  > = B extends `${infer BH}${infer BT}`
    ? mulReversedByString<A, BT, addStrings<`${P}0`, mulReversedByDigit<A, BH>>>
    : P;

  // multiply two strings
  type multiplyPos<A extends string, B extends string> = stripLeadingZeroes<
    mulReversedByString<reverse<A>, B>
  >;

  type multiplyStrings<
    A extends string,
    B extends string
  > = isNegative<A> extends true
    ? isNegative<B> extends true
      ? multiplyPos<flipSign<A>, flipSign<B>> //-A * -B = A*B
      : flipSign<multiplyPos<flipSign<A>, B>> //-A * B = -(A*B)
    : isNegative<B> extends true
    ? flipSign<multiplyPos<A, flipSign<B>>> //A * -B = -(A*B)
    : multiplyPos<A, B>; //A*B

  type multiplyNumbers<A extends number, B extends number> = parseNum<
    multiplyStrings<`${A}`, `${B}`>
  >;
  // end math

  type input = `
noop
noop
noop
addx 6
addx -1
addx 5
noop
noop
noop
addx 5
addx -8
addx 9
addx 3
addx 2
addx 4
addx 3
noop
addx 2
noop
addx 1
addx 6
noop
noop
noop
addx -39
noop
addx 5
addx 2
addx -2
addx 3
addx 2
addx 5
addx 2
addx 2
addx 13
addx -12
noop
addx 7
noop
addx 2
addx 3
noop
addx -25
addx 30
addx -10
addx 13
addx -40
noop
addx 5
addx 2
addx 3
noop
addx 2
addx 3
addx -2
addx 3
addx -1
addx 7
noop
noop
addx 5
addx -1
addx 6
noop
noop
noop
noop
addx 9
noop
addx -1
noop
addx -39
addx 2
addx 33
addx -29
addx 1
noop
addx 4
noop
noop
noop
addx 3
addx 2
noop
addx 3
noop
noop
addx 7
addx 2
addx 3
addx -2
noop
addx -30
noop
addx 40
addx -2
addx -38
noop
noop
noop
addx 5
addx 5
addx 2
addx -9
addx 5
addx 7
addx 2
addx 5
addx -18
addx 28
addx -7
addx 2
addx 5
addx -28
addx 34
addx -3
noop
addx 3
addx -38
addx 10
addx -3
addx 29
addx -28
addx 2
noop
noop
noop
addx 5
noop
addx 3
addx 2
addx 7
noop
addx -2
addx 5
addx 2
noop
addx 1
addx 5
noop
noop
addx -25
noop
noop
`;

  type output = [day10part1<input>, day10part2<input>];

  // to see the letters:
  type viz = ["_____________", ...day10part2<input>];
}
